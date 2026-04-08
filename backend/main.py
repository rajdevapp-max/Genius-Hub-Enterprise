"""
main.py — Vercel-Compatible Backend API v44.0 (UI Sync Update)
Features: Merges normal search queries into the Mandatory bucket so frontend highlighting matches user intent.
"""
import os
import zipfile
import shutil
import threading 
from huggingface_hub import hf_hub_download

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"

from dotenv import load_dotenv
load_dotenv()

def sync_cloud_resumes():
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("⚠️ No HF_TOKEN found! Skipping cloud sync.", flush=True)
        return
        
    print("☁️ Syncing Cloud Database & Search Index...", flush=True)
    try:
        db_path = hf_hub_download(repo_id="Vinu019/company-resumes", filename="resumes.db", repo_type="dataset", token=token)
        shutil.copy(db_path, "resumes.db")
        
        index_path = hf_hub_download(repo_id="Vinu019/company-resumes", filename="faiss_index.bin", repo_type="dataset", token=token)
        shutil.copy(index_path, "faiss_index.bin")

        zip_path = hf_hub_download(repo_id="Vinu019/company-resumes", filename="resumes.zip", repo_type="dataset", token=token)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall("resumes")
            
        print("✅ SYSTEM FULLY RESTORED FROM CLOUD! 30K+ RESUMES READY.", flush=True)
    except Exception as e:
        print(f"⚠️ Cloud Sync failed: {e}", flush=True)

sync_cloud_resumes() 

import json
import time
import re
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import csv
import io
from datetime import datetime
from sqlalchemy import or_

from database import init_db, SessionLocal, Resume
from embedder import resume_index
from extractor import process_resume, batch_process
from classifier import classify_resume, extract_skills_regex, extract_all_skills, extract_education
from watcher import start_watcher_thread, get_watcher_stats
from dedup import find_duplicates, remove_duplicates, scan_folder_duplicates

from model_trainer import start_ml_cron, train_ml_model 

init_db()
start_watcher_thread()
start_ml_cron() 

app = FastAPI(title="Resume AI Intelligence Platform", version="44.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RESUME_DIR = os.environ.get("RESUME_DIR", "resumes")
os.makedirs(RESUME_DIR, exist_ok=True)

GEO_MAPPING = {
    "india": ["india", "maharashtra", "mumbai", "delhi", "bangalore", "bengaluru", "karnataka", "hyderabad", "telangana", "chennai", "tamil nadu", "pune", "gurgaon", "gurugram", "noida", "up", "uttar pradesh", "gujarat", "ahmedabad", "kolkata", "rohtak", "haryana", "punjab", "chandigarh", "rajasthan", "kerala", "kochi", "trivandrum"],
    "usa": ["usa", "us", "united states", "america", "ny", "new york", "ca", "california", "sf", "san francisco", "texas", "tx", "austin", "dallas", "houston", "washington", "wa", "florida", "fl", "miami", "chicago", "il", "illinois", "boston", "ma", "colorado", "atlanta", "nc", "nj", "va", "oh", "ga", "mi", "az", "md", "co", "mn", "wi", "tn", "mo", "ct", "ut", "sc", "nv", "al", "ak", "ar", "de", "hi", "id", "ia", "ks", "ky", "la", "ms", "mt", "ne", "nh", "nm", "nd", "ok", "pa", "ri", "sd", "vt", "wv", "wy"],
    "uk": ["uk", "united kingdom", "london", "manchester", "birmingham", "edinburgh", "scotland", "england", "wales", "ireland", "dublin"],
    "canada": ["canada", "toronto", "ontario", "vancouver", "bc", "british columbia", "montreal", "quebec", "calgary", "alberta", "ottawa"],
    "australia": ["australia", "sydney", "nsw", "melbourne", "victoria", "brisbane", "queensland", "perth", "adelaide"],
    "europe": ["europe", "germany", "berlin", "munich", "france", "paris", "netherlands", "amsterdam", "spain", "madrid", "barcelona", "italy"]
}

class SearchRequest(BaseModel):
    query: str = ""
    page: int = 1         
    per_page: int = 30    
    top_n: int = 0        
    min_experience: float = 0
    mandatory_skills: list[str] = []
    secondary_skills: list[str] = []
    mandatory_location: str = ""
    mandatory_education: str = ""
    require_linkedin: bool = False
    require_github: bool = False
    require_leetcode: bool = False
    require_hackerrank: bool = False
    require_codechef: bool = False

class JDMatchRequest(BaseModel):
    job_description: str
    top_k: int = 100
    location: str = ""
    key_skills: str = ""

def match_location(req_loc: str, resume_loc: str) -> bool:
    if not req_loc: return True
    if not resume_loc: return False 
    req_loc = req_loc.lower().strip()
    res_loc = resume_loc.lower()
    search_terms = GEO_MAPPING.get(req_loc, [req_loc])
    if req_loc not in search_terms: search_terms.append(req_loc)
    for term in search_terms:
        if re.search(r'\b' + re.escape(term) + r'\b', res_loc): 
            return True
    return False

def extract_snippet(text: str, keyword: str, window: int = 60) -> str:
    if not text or not keyword: return ""
    match = re.search(r'\b' + re.escape(keyword.lower()) + r'\b', text.lower())
    if not match: return ""
    idx = match.start()
    start = max(0, idx - window)
    end = min(len(text), idx + len(keyword) + window)
    return f"{'...' if start > 0 else ''}{text[start:end].replace(chr(10), ' ').strip()}{'...' if end < len(text) else ''}"

def extract_trajectory(text: str) -> dict:
    matches = re.findall(r'\b((?:19|20)\d{2})\s*(?:-|to|–|—)\s*((?:19|20)\d{2}|Present|Current|Now)\b', text, re.IGNORECASE)
    if not matches: return {"job_hopper": False, "has_gap": False}
    years = []
    current_year = datetime.now().year
    for start, end in matches:
        try:
            sy = int(start)
            ey = current_year if end.lower() in ['present', 'current', 'now'] else int(end)
            if 1980 < sy <= ey <= current_year + 1: years.append((sy, ey))
        except: pass
    if not years: return {"job_hopper": False, "has_gap": False}
    years.sort(key=lambda x: x[0])
    has_gap = any(years[i][0] - years[i-1][1] > 1 for i in range(1, len(years)))
    job_hopper = len(years) >= 4 and (max(y[1] for y in years) - min(y[0] for y in years)) <= 4
    return {"job_hopper": job_hopper, "has_gap": has_gap}

def parse_dynamic_query(query: str) -> list[str]:
    clean_query = re.sub(r'[^a-zA-Z0-9\s\.\+#]', ' ', query).lower()
    words = clean_query.split()
    ignore_words = {"with", "and", "or", "in", "for", "experience", "years", "developer", "engineer", "usa", "us", "india", "uk", "canada", "australia", "europe"}
    return [w for w in words if w not in ignore_words and len(w) > 2]

def parse_universal_jd(text: str) -> list[str]:
    if len(text.split()) < 15:
        clean = re.sub(r'[^a-zA-Z0-9\s\.\+#-]', ' ', text).lower()
        ignore = {"with", "and", "or", "in", "for", "experience", "years", "developer", "engineer", "the", "a", "an", "is", "of", "to", "at", "by", "on"}
        words = [w.title() for w in clean.split() if w not in ignore and len(w) > 2]
        return list(set(words))
        
    known_skills = extract_all_skills(text)
    edu = extract_education(text)
    
    stopwords = {"the","and","for","with","experience","knowledge","skills","required","preferred","team","work","years","looking","candidate","role","job","description","requirements","nice","have","must","strong","understanding","ability","working","environment","development","management","business","support","design","including","related","using","building","systems","new","data","based","high","quality","across","multiple","different","various","best","practices","proven","excellent","good","written","verbal","communication","degree","bachelors","masters","phd","computer","science","engineering","equivalent","software","hardware","technical","technology","tools","technologies","applications","application","web","mobile","cloud","infrastructure","architecture","services","service","product","products","project","projects","process","processes","testing","test","tests","code","coding","programming","language","languages","framework","frameworks","library","libraries","database","databases","system","networks","security","secure","user","users","client","clients","customer","customers","internal","external","internal/external","agile","scrum","sprint","sprints","cycle","cycles","life","lifecycle","end","end-to-end","full","stack","front","back","frontend","backend","ui","ux","interface","user-interface","user-experience","designer","manager","director","lead","leader","senior","junior","mid","level","entry","entry-level","mid-level","senior-level","principal","staff","architect","architects","this","that","are","you","will","can","not","from","what","how","why","about","our","your","which","their","there","here","all","any","some","many","most","other","another","such","only","same","own","very","too","also","well","even","still","just","now","then","today","tomorrow","yesterday","always","never","often","sometimes","usually","rarely","once","twice","again","soon","early","late","first","last","next","previous","past","future","current","present", "usa", "india", "uk", "canada", "australia"}
    
    words = re.findall(r'\b[A-Z][a-zA-Z0-9.-]{2,}\b', text)
    custom = [w for w in words if w.lower() not in stopwords]
    quoted = re.findall(r'"([^"]+)"', text)
    
    combined = []
    seen = set()
    
    lists_to_check = [quoted]
    if edu: lists_to_check.append([edu])
    lists_to_check.extend([known_skills, custom])
    
    for lst in lists_to_check:
        for item in lst:
            if item.lower() not in seen:
                seen.add(item.lower())
                combined.append(item)
                
    return combined[:25] 

def _resume_to_dict(resume, similarity: float = 0, mandatory_skills=None, secondary_skills=None, dynamic_skills=None) -> dict:
    skills = json.loads(resume.skills) if resume.skills else []
    certs = json.loads(resume.certificates) if resume.certificates else []
    hyperlinks = json.loads(resume.hyperlinks) if resume.hyperlinks else []
    
    mandatory_skills = mandatory_skills or []
    secondary_skills = secondary_skills or []
    dynamic_skills = dynamic_skills or []
    
    skills_lower = [s.lower() for s in skills]
    raw_text = resume.raw_text or ""
    raw_text_lower = raw_text.lower()
    location_lower = (resume.location or "").lower()
    
    matched_mandatory = []
    matched_secondary = []
    matched_dynamic = []
    context_snippets = []
    
    for qs in mandatory_skills:
        pattern = r'\b' + re.escape(qs.lower()) + r'\b'
        if any(re.search(pattern, sl) for sl in skills_lower) or re.search(pattern, raw_text_lower) or re.search(pattern, location_lower):
            matched_mandatory.append(qs)
            snippet = extract_snippet(raw_text, qs)
            if snippet: context_snippets.append({"skill": qs, "context": snippet, "type": "mandatory"})
            
    for qs in secondary_skills:
        pattern = r'\b' + re.escape(qs.lower()) + r'\b'
        if any(re.search(pattern, sl) for sl in skills_lower) or re.search(pattern, raw_text_lower) or re.search(pattern, location_lower):
            matched_secondary.append(qs)
            snippet = extract_snippet(raw_text, qs)
            if snippet: context_snippets.append({"skill": qs, "context": snippet, "type": "secondary"})

    for qs in dynamic_skills:
        pattern = r'\b' + re.escape(qs.lower()) + r'\b'
        if any(re.search(pattern, sl) for sl in skills_lower) or re.search(pattern, raw_text_lower) or re.search(pattern, location_lower):
            matched_dynamic.append(qs)
            snippet = extract_snippet(raw_text, qs)
            if snippet: context_snippets.append({"skill": qs, "context": snippet, "type": "dynamic"})

    linkedin_url = next((link for link in hyperlinks if "linkedin.com" in link.lower()), None)
    github_url = next((link for link in hyperlinks if "github.com" in link.lower()), None)

    base_visual_score = float(resume.score or 40.0) 
    impact_score = float(getattr(resume, "impact_score", 0.0))
    fraud_flag = int(getattr(resume, "fraud_flag", 0))

    mandatory_ratio = len(matched_mandatory) / max(len(mandatory_skills), 1) if mandatory_skills else 0.0
    secondary_ratio = len(matched_secondary) / max(len(secondary_skills), 1) if secondary_skills else 0.0
    dynamic_ratio = len(matched_dynamic) / max(len(dynamic_skills), 1) if dynamic_skills else 0.0
    sim_boost = similarity * 25 if similarity > 0 else 0

    if mandatory_skills or secondary_skills or dynamic_skills or similarity > 0:
        dynamic_ats = (mandatory_ratio * 40) + (secondary_ratio * 20) + (dynamic_ratio * 20) + sim_boost + (base_visual_score * 0.10) + impact_score
    else:
        dynamic_ats = base_visual_score + sim_boost + impact_score
    
    if linkedin_url: dynamic_ats += 2
    if github_url: dynamic_ats += 2
    final_score = min(max(int(dynamic_ats), 15), 99)

    trajectory = extract_trajectory(raw_text)
    gap_years = getattr(resume, "total_gap_years", 0.0)
    rel_exp = getattr(resume, "relevant_experience_years", resume.experience_years)

    # 🎯 THE FIX: Group matched_dynamic (Normal Search terms) with matched_mandatory so they turn Green!
    combined_mandatory = list(set(matched_mandatory + matched_dynamic))

    return {
        "id": resume.id, "name": resume.name, "email": resume.email, "phone": resume.phone,
        "location": resume.location, "education": resume.education, "experience_years": resume.experience_years,
        "relevant_experience_years": rel_exp, "total_gap_years": gap_years, "skills": skills,
        "matched_mandatory": combined_mandatory, "matched_secondary": matched_secondary,
        "missing_mandatory": list(set(mandatory_skills) - set(matched_mandatory)), "context_snippets": context_snippets,
        "summary": resume.summary, "score": final_score, "ats_score": round(base_visual_score, 1),
        "filename": resume.filename, "certificates": certs, "hyperlinks": hyperlinks,
        "linkedin": linkedin_url, "github": github_url, "has_image": bool(resume.has_image),
        "page_count": resume.page_count, "word_count": resume.word_count,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "fraud_flag": fraud_flag, "fraud_reason": getattr(resume, "fraud_reason", ""),
        "impact_score": impact_score, "job_hopper": trajectory["job_hopper"],
        "has_gap": trajectory["has_gap"] or gap_years > 0, "fake_full_stack": bool(getattr(resume, "fake_full_stack", False)),
        "open_source": bool(getattr(resume, "open_source", False)),
    }

@app.post("/api/search")
def search_resumes(req: SearchRequest):
    start = time.time()
    db = SessionLocal()
    candidates = []
    FETCH_LIMIT = 1000 
    try:
        original_query = req.query or ""
        detected_location = req.mandatory_location
        if not detected_location:
            clean_q_lower = original_query.lower()
            for loc_key in GEO_MAPPING.keys():
                if re.search(r'\b' + re.escape(loc_key) + r'\b', clean_q_lower):
                    detected_location = loc_key
                    break

        exact_phrases = re.findall(r'"([^"]+)"', original_query)
        not_terms = re.findall(r'\bNOT\s+([a-zA-Z0-9_.-]+)', original_query, re.IGNORECASE)
        clean_vector_query = re.sub(r'"([^"]+)"', '', original_query)
        clean_vector_query = re.sub(r'\bNOT\s+[a-zA-Z0-9_.-]+', '', clean_vector_query, flags=re.IGNORECASE).strip()
        dynamic_skills = parse_dynamic_query(clean_vector_query) if clean_vector_query else []
        combined_query = f"{clean_vector_query} {' '.join(req.mandatory_skills)} {' '.join(req.secondary_skills)}".strip()
        
        vector_results = []
        existing_ids = set()

        search_terms = dynamic_skills + req.mandatory_skills + req.secondary_skills + exact_phrases
        if search_terms:
            conditions = []
            for term in search_terms:
                if len(term) > 2:
                    conditions.append(Resume.raw_text.ilike(f"%{term}%"))
                    conditions.append(Resume.skills.ilike(f"%{term}%"))
                    conditions.append(Resume.location.ilike(f"%{term}%"))
            if conditions:
                exact_matches = db.query(Resume).filter(or_(*conditions)).limit(FETCH_LIMIT).all()
                for r in exact_matches:
                    existing_ids.add(r.id)
                    vector_results.append({"id": r.id, "similarity": 0.6}) 

        if combined_query:
            faiss_results = resume_index.search(combined_query, FETCH_LIMIT)
            for vr in faiss_results:
                if vr["id"] not in existing_ids:
                    existing_ids.add(vr["id"])
                    vector_results.append(vr)
        
        if not vector_results:
            all_resumes = db.query(Resume).limit(FETCH_LIMIT).all()
            vector_results = [{"id": r.id, "similarity": 0} for r in all_resumes]
        
        all_target_ids = [vr.get("id") for vr in vector_results if vr.get("id") is not None]
        resumes_batch = db.query(Resume).filter(Resume.id.in_(all_target_ids)).all()
        resume_map = {r.id: r for r in resumes_batch}
        
        for vr in vector_results:
            rid = vr.get("id")
            resume = resume_map.get(rid)
            if not resume: continue

            if detected_location and not match_location(detected_location, resume.location): continue

            raw_text = (resume.raw_text or "").lower()
            skills_text_lower = (resume.skills or "").lower()
            links_str = "".join(json.loads(resume.hyperlinks) if resume.hyperlinks else []).lower()
            certs_str = "".join(json.loads(resume.certificates) if resume.certificates else []).lower()
            universal_text = f"{raw_text} {links_str} {certs_str} {(resume.location or '').lower()}"

            if any(phrase.lower() not in universal_text for phrase in exact_phrases): continue
            if any(term.lower() in universal_text for term in not_terms): continue
            if req.min_experience > 0 and resume.experience_years < req.min_experience: continue
            if req.mandatory_education and req.mandatory_education.lower() not in (resume.education or "").lower(): continue

            if req.require_linkedin and "linkedin.com" not in links_str and "linkedin.com" not in raw_text: continue
            if req.require_github and "github.com" not in links_str and "github.com" not in raw_text: continue
            if req.require_leetcode and "leetcode.com" not in links_str and "leetcode.com" not in raw_text: continue
            if req.require_hackerrank and "hackerrank.com" not in links_str and "hackerrank.com" not in raw_text: continue
            if req.require_codechef and "codechef.com" not in links_str and "codechef.com" not in raw_text: continue

            missing_mandatory = False
            for m_skill in req.mandatory_skills:
                pattern = r'\b' + re.escape(m_skill.lower()) + r'\b'
                if not any(re.search(pattern, sl) for sl in skills_text_lower.split(',')) and not re.search(pattern, raw_text) and not re.search(pattern, (resume.location or "").lower()):
                    missing_mandatory = True
                    break
            if missing_mandatory: continue 

            d = _resume_to_dict(resume, similarity=vr.get("similarity", 0), mandatory_skills=req.mandatory_skills, secondary_skills=req.secondary_skills, dynamic_skills=dynamic_skills)
            if dynamic_skills and len(d["matched_secondary"]) == 0 and not d["matched_mandatory"]: continue
                
            for phrase in exact_phrases:
                snippet = extract_snippet(raw_text, phrase)
                if snippet: d["context_snippets"].append({"skill": phrase, "context": snippet, "type": "exact"})
            
            candidates.append(d)

    finally: db.close()

    candidates.sort(key=lambda x: -x["score"])
    if req.top_n > 0: candidates = candidates[:req.top_n]
    
    total_matches = len(candidates)
    total_pages = (total_matches + req.per_page - 1) // req.per_page
    start_idx = (req.page - 1) * req.per_page
    end_idx = start_idx + req.per_page
    
    return {
        "candidates": candidates[start_idx:end_idx], "total_matches": total_matches,
        "page": req.page, "total_pages": total_pages, "per_page": req.per_page,
        "total_time": round(time.time() - start, 2), "total_indexed": resume_index.total
    }

@app.post("/api/match-jd")
def match_jd(req: JDMatchRequest):
    start = time.time()
    extracted_reqs = parse_universal_jd(req.job_description)
    
    user_key_skills = [s.strip().title() for s in req.key_skills.split(',') if s.strip()]
    for ks in reversed(user_key_skills):
        if ks in extracted_reqs:
            extracted_reqs.remove(ks)
        extracted_reqs.insert(0, ks)

    db = SessionLocal()
    candidates = []
    try:
        results = resume_index.search(req.job_description, req.top_k * 5)
        existing_ids = set()

        all_target_ids = [r.get("id") for r in results if r.get("id") is not None]
        resumes_batch = db.query(Resume).filter(Resume.id.in_(all_target_ids)).all()
        resume_map = {r.id: r for r in resumes_batch}

        for r in results:
            rid = r.get("id")
            resume = resume_map.get(rid)
            if not resume: continue 

            if req.location and not match_location(req.location, resume.location): 
                continue

            if user_key_skills:
                missing_key = False
                raw_text = (resume.raw_text or "").lower()
                skills_text = (resume.skills or "").lower()
                for ks in user_key_skills:
                    pat = r'\b' + re.escape(ks.lower()) + r'\b'
                    if not (re.search(pat, raw_text) or re.search(pat, skills_text)):
                        missing_key = True
                        break
                if missing_key: continue

            existing_ids.add(rid)
            d = _resume_to_dict(resume, similarity=r["similarity"], mandatory_skills=extracted_reqs, secondary_skills=[])
            if extracted_reqs and len(d["matched_mandatory"]) == 0: continue
            candidates.append(d)

        if len(candidates) < req.top_k and extracted_reqs:
            conditions = []
            for sk in extracted_reqs[:8]: 
                conditions.append(Resume.raw_text.ilike(f"%{sk}%"))
                conditions.append(Resume.skills.ilike(f"%{sk}%"))
                
            if conditions:
                fallback = db.query(Resume).filter(or_(*conditions)).limit(req.top_k).all()
                for r in fallback:
                    if r.id not in existing_ids:
                        if req.location and not match_location(req.location, r.location): continue
                        
                        if user_key_skills:
                            missing_key = False
                            raw_text = (r.raw_text or "").lower()
                            skills_text = (r.skills or "").lower()
                            for ks in user_key_skills:
                                pat = r'\b' + re.escape(ks.lower()) + r'\b'
                                if not (re.search(pat, raw_text) or re.search(pat, skills_text)):
                                    missing_key = True
                                    break
                            if missing_key: continue

                        existing_ids.add(r.id)
                        d = _resume_to_dict(r, similarity=0.4, mandatory_skills=extracted_reqs, secondary_skills=[])
                        if len(d["matched_mandatory"]) > 0: candidates.append(d)

        candidates.sort(key=lambda x: (len(x["matched_mandatory"]), x["score"]), reverse=True)
        candidates = candidates[:req.top_k]

        for i, c in enumerate(candidates): 
            c["rank"] = i + 1

    finally:
        db.close()

    return {"candidates": candidates, "required_skills": extracted_reqs, "total_resumes": resume_index.total, "total_time": time.time() - start}

@app.get("/api/duplicates")
def get_duplicates(): return {"db_duplicates": find_duplicates(), "folder_duplicates": scan_folder_duplicates(), "total_duplicate_groups": len(find_duplicates()), "total_duplicate_files": sum(d["count"] - 1 for d in find_duplicates())}

@app.post("/api/duplicates/remove")
def remove_dupes(dry_run: bool = Query(False)): return remove_duplicates(dry_run=dry_run)

@app.get("/api/preview/{resume_id}")
def preview_resume(resume_id: int):
    db = SessionLocal()
    try:
        resume = db.query(Resume).get(resume_id)
        if not resume: raise HTTPException(404, "Not found")
        return {"id": resume.id, "name": resume.name, "filename": resume.filename, "raw_text": resume.raw_text or "", "score": resume.score}
    finally: db.close()

@app.get("/api/resumes/{filename}")
def download_resume(filename: str): return FileResponse(os.path.join(RESUME_DIR, filename), filename=filename)

@app.get("/api/browse")
def browse_resumes(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100), sort_by: str = Query("score"), sort_order: str = Query("desc"), skill_filter: str = Query(""), location_filter: str = Query("")):
    db = SessionLocal()
    try:
        q = db.query(Resume)
        if skill_filter: q = q.filter(Resume.skills.contains(skill_filter))
        if location_filter: q = q.filter(Resume.location.ilike(f"%{location_filter}%"))
        total = q.count()
        valid_sorts = {"score", "name", "experience_years", "created_at", "word_count", "page_count"}
        col = getattr(Resume, sort_by if sort_by in valid_sorts else "score", Resume.score)
        q = q.order_by(col.desc()) if sort_order == "desc" else q.order_by(col.asc())
        resumes = q.offset((page - 1) * per_page).limit(per_page).all()
        return {"candidates": [_resume_to_dict(r) for r in resumes], "total": total, "page": page, "per_page": per_page, "total_pages": (total + per_page - 1) // per_page}
    finally: db.close()

@app.get("/api/suggestions")
def search_suggestions(q: str = Query("", min_length=1)):
    db = SessionLocal()
    try:
        q_lower = q.lower()
        sug = {"names": [], "skills": [], "locations": []}
        name_set, skill_set, loc_set = set(), set(), set()
        for r in db.query(Resume).limit(5000).all():
            if q_lower in (r.name or "").lower() and r.name not in name_set: name_set.add(r.name); sug["names"].append(r.name)
            if r.location and q_lower in r.location.lower() and r.location not in loc_set: loc_set.add(r.location); sug["locations"].append(r.location)
            for s in (json.loads(r.skills) if r.skills else []):
                if q_lower in s.lower() and s not in skill_set: skill_set.add(s); sug["skills"].append(s)
            if len(name_set) >= 8 and len(skill_set) >= 8: break
        return {"names": sug["names"][:10], "skills": sug["skills"][:10], "locations": sug["locations"][:8]}
    finally: db.close()

@app.get("/api/stats")
def get_stats():
    db = SessionLocal()
    try:
        resumes = db.query(Resume).all()
        total = len(resumes)
        if total == 0: return {"total_resumes": 0, "avg_experience": 0, "avg_score": 0, "top_skills": [], "experience_distribution": [], "location_distribution": [], "education_distribution": [], "score_distribution": [], "processing_status": get_watcher_stats(), "certificates_count": 0, "resumes_with_images": 0, "avg_word_count": 0, "avg_page_count": 0, "skill_categories": []}
        
        valid_exps = [r.experience_years for r in resumes if r.experience_years is not None and r.experience_years <= 50]
        avg_exp = sum(valid_exps) / len(valid_exps) if valid_exps else 0
        
        avg_score = sum(r.score for r in resumes) / total
        avg_words = sum(r.word_count for r in resumes) / total
        avg_pages = sum(r.page_count for r in resumes) / total
        resumes_with_images = sum(1 for r in resumes if r.has_image)
        fraud_count = sum(1 for r in resumes if getattr(r, "fraud_flag", 0) == 1)
        avg_impact = sum(getattr(r, "impact_score", 0.0) for r in resumes) / total
        total_certs = sum(len(json.loads(r.certificates) if r.certificates else []) for r in resumes)
        
        skill_count = {}
        for r in resumes:
            for s in (json.loads(r.skills) if r.skills else []): skill_count[s] = skill_count.get(s, 0) + 1
        top_skills = sorted(skill_count.items(), key=lambda x: -x[1])[:30]
        
        exp_ranges = {"0-2y": 0, "2-5y": 0, "5-8y": 0, "8-12y": 0, "12+y": 0}
        for r in resumes:
            y = r.experience_years or 0
            if y > 50: continue 
            if y <= 2: exp_ranges["0-2y"] += 1
            elif y <= 5: exp_ranges["2-5y"] += 1
            elif y <= 8: exp_ranges["5-8y"] += 1
            elif y <= 12: exp_ranges["8-12y"] += 1
            else: exp_ranges["12+y"] += 1
            
        loc_count = {}
        for r in resumes:
            if r.location: loc_count[r.location] = loc_count.get(r.location, 0) + 1
            
        edu_count = {}
        for r in resumes:
            if r.education: edu_count[r.education] = edu_count.get(r.education, 0) + 1
            
        score_ranges = {"10-30": 0, "30-50": 0, "50-70": 0, "70-85": 0, "85-100": 0}
        for r in resumes:
            s = r.score
            if s < 30: score_ranges["10-30"] += 1
            elif s < 50: score_ranges["30-50"] += 1
            elif s < 70: score_ranges["50-70"] += 1
            elif s < 85: score_ranges["70-85"] += 1
            else: score_ranges["85-100"] += 1
        
        return {"total_resumes": total, "avg_experience": round(avg_exp, 1), "avg_score": round(avg_score, 1), "avg_word_count": round(avg_words), "avg_page_count": round(avg_pages, 1), "resumes_with_images": resumes_with_images, "certificates_count": total_certs, "top_skills": [{"skill": s, "count": c} for s, c in top_skills], "experience_distribution": [{"range": k, "count": v} for k, v in exp_ranges.items()], "location_distribution": [{"location": l, "count": c} for l, c in sorted(loc_count.items(), key=lambda x: -x[1])[:15]], "education_distribution": [{"education": e, "count": c} for e, c in sorted(edu_count.items(), key=lambda x: -x[1])], "score_distribution": [{"range": k, "count": v} for k, v in score_ranges.items()], "processing_status": get_watcher_stats(), "fraud_count": fraud_count, "avg_impact_score": round(avg_impact, 1)}
    finally: db.close()

@app.get("/api/live-status")
def live_status():
    db = SessionLocal()
    try: return {"total_resumes": db.query(Resume).count(), "indexed": resume_index.total, **get_watcher_stats()}
    finally: db.close()

def trigger_ml_event():
    time.sleep(15)
    train_ml_model()

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...)):
    path = os.path.join(RESUME_DIR, file.filename)
    content = await file.read()
    with open(path, "wb") as f: 
        f.write(content)
        
    threading.Thread(target=trigger_ml_event, daemon=True).start()
    
    return {"message": "File received. AI is extracting data and ML engine is recalibrating.", "data": {"id": 0, "name": file.filename}}

@app.post("/api/upload-batch")
async def upload_batch(files: list[UploadFile] = File(...)):
    saved = []
    for file in files:
        path = os.path.join(RESUME_DIR, file.filename)
        content = await file.read()
        with open(path, "wb") as f: 
            f.write(content)
        saved.append({"name": file.filename})
        
    threading.Thread(target=trigger_ml_event, daemon=True).start()
    
    return {"message": f"Successfully received {len(saved)} resumes. Engine extracting data and ML is training.", "results": saved}

@app.post("/api/candidate/{resume_id}/delete")
def delete_resume(resume_id: int):
    db = SessionLocal()
    try:
        resume = db.query(Resume).get(resume_id)
        if not resume: raise HTTPException(404, "Resume not found")
        file_path = os.path.join(RESUME_DIR, resume.filename)
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass 
        db.delete(resume)
        db.commit()
        if hasattr(resume_index, 'remove'):
            try: resume_index.remove(resume_id)
            except: pass
        return {"message": "Successfully deleted profile", "id": resume_id}
    finally: db.close()

@app.get("/api/export")
def export_csv(ids: str = Query("")):
    db = SessionLocal()
    try:
        resumes = db.query(Resume).filter(Resume.id.in_([int(i) for i in ids.split(",") if i.strip().isdigit()])).all() if ids else db.query(Resume).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Rank", "Name", "Email", "Phone", "Location", "Experience Years", "Skills", "ATS Score"])
        for rank, r in enumerate(sorted(resumes, key=lambda r: -r.score), 1):
            writer.writerow([rank, r.name, r.email, r.phone, r.location, r.experience_years, "; ".join(json.loads(r.skills) if r.skills else []), round(r.score)])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=candidates_export.csv"})
    finally: db.close()

class DeleteBatchRequest(BaseModel):
    ids: list[int]

@app.post("/api/candidates/delete-batch")
def delete_batch(req: DeleteBatchRequest):
    db = SessionLocal()
    try:
        resumes = db.query(Resume).filter(Resume.id.in_(req.ids)).all()
        for r in resumes:
            file_path = os.path.join(RESUME_DIR, r.filename)
            if os.path.exists(file_path):
                try: os.remove(file_path)
                except: pass
            db.delete(r)
            if hasattr(resume_index, 'remove'):
                try: resume_index.remove(r.id)
                except: pass
        db.commit()
        return {"message": f"Successfully deleted {len(resumes)} profiles."}
    finally: db.close()

@app.post("/api/candidates/delete-all")
def delete_all():
    db = SessionLocal()
    try:
        resumes = db.query(Resume).all()
        for r in resumes:
            file_path = os.path.join(RESUME_DIR, r.filename)
            if os.path.exists(file_path):
                try: os.remove(file_path)
                except: pass
        db.query(Resume).delete()
        db.commit()
        return {"message": "NUCLEAR WIPE COMPLETE. Database is now empty."}
    finally: db.close()

@app.get("/")
def root(): return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)