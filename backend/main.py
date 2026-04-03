"""
main.py — Vercel-Compatible Backend API v32.0
Features: Multi-threading extractor, FAISS vector search, strict location hard-block.
"""
import os
import zipfile
import shutil
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

init_db()
start_watcher_thread()

app = FastAPI(title="Resume AI Intelligence Platform", version="32.0")
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
    "usa": ["usa", "us", "united states", "america", "ny", "new york", "ca", "california", "sf", "san francisco", "texas", "tx", "austin", "dallas", "houston", "washington", "wa", "florida", "fl", "miami", "chicago", "il", "illinois", "boston", "ma", "colorado", "atlanta", "nc", "nj", "va", "oh", "ga", "mi", "az", "md", "co", "mn", "in", "wi", "tn", "mo", "ct", "ut", "sc", "nv", "or", "al", "ak", "ar", "de", "hi", "id", "ia", "ks", "ky", "la", "me", "ms", "mt", "ne", "nh", "nm", "nd", "ok", "pa", "ri", "sd", "vt", "wv", "wy"],
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

# 🎯 THE FIX: Enhanced strict-filtering sync between AI Search and JD Match
def match_location(req_loc: str, resume_loc: str, raw_text: str = "") -> bool:
    if not req_loc: return True
    req_loc = req_loc.lower().strip()
    res_loc = (resume_loc or "").lower()
    r_text = (raw_text or "").lower()
    
    search_terms = GEO_MAPPING.get(req_loc, [req_loc])
    if req_loc not in search_terms: search_terms.append(req_loc)
    
    for term in search_terms:
        pattern = r'\b' + re.escape(term) + r'\b'
        # Crucial check: req location must be found in resume_loc OR raw_text deep scan
        if re.search(pattern, res_loc) or re.search(pattern, r_text): 
            return True
    return False

# extract_snippet remains unchanged
# extract_trajectory remains unchanged
# parse_dynamic_query remains unchanged
# parse_universal_jd remains unchanged
# _resume_to_dict remains unchanged

@app.post("/api/search")
def search_resumes(req: SearchRequest):
    start = time.time()
    db = SessionLocal()
    candidates = []
    FETCH_LIMIT = 1000 
    try:
        original_query = req.query or ""
        detected_location = req.mandatory_location
        # Location Auto-Detection from Query
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
        
        for vr in vector_results:
            rid = vr.get("id")
            resume = db.query(Resume).get(rid)
            if not resume: continue

            raw_text = (resume.raw_text or "").lower()

            # 🎯 AI Search strict location enforcement
            if detected_location and not match_location(detected_location, resume.location, raw_text): continue

            # ... remaining strict filtering conditions remain unchanged
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

    db = SessionLocal()
    candidates = []
    try:
        results = resume_index.search(req.job_description, req.top_k * 5)
        existing_ids = set()

        for r in results:
            rid = r.get("id")
            resume = db.query(Resume).get(rid)
            if not resume: continue 

            # 🎯 THE FIX (HARD BLOCK): JD Match strict location enforcement
            # If a user requested a location and the candidate doesn't match it strictly,
            # they are instantly DISCARDED, regardless of FAISS similarity score.
            if req.location and not match_location(req.location, resume.location, resume.raw_text): 
                continue

            existing_ids.add(rid)
            
            d = _resume_to_dict(
                resume, 
                similarity=r["similarity"], 
                mandatory_skills=extracted_reqs, 
                secondary_skills=[]
            )
            
            # Technical strict filtering remains
            if extracted_reqs and len(d["matched_mandatory"]) == 0:
                continue
                
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
                        # 🎯 THE FIX (HARD BLOCK) applied to fallback results
                        if req.location and not match_location(req.location, r.location, r.raw_text): continue
                        existing_ids.add(r.id)
                        d = _resume_to_dict(
                            r, 
                            similarity=0.4, 
                            mandatory_skills=extracted_reqs, 
                            secondary_skills=[]
                        )
                        if len(d["matched_mandatory"]) > 0:
                            candidates.append(d)

        candidates.sort(key=lambda x: (len(x["matched_mandatory"]), x["score"]), reverse=True)
        candidates = candidates[:req.top_k]

        for i, c in enumerate(candidates): 
            c["rank"] = i + 1

    finally:
        db.close()

    return {
        "candidates": candidates, 
        "required_skills": extracted_reqs, 
        "total_resumes": resume_index.total, 
        "total_time": time.time() - start
    }

# Remaining utility endpoints (Duplicates, Preview, Browse, Stats) remain unchanged
# watcher/ watcher stats remain unchanged

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...)):
    path = os.path.join(RESUME_DIR, file.filename)
    content = await file.read()
    with open(path, "wb") as f: 
        f.write(content)
    return {"message": "File received. AI is processing in the background.", "data": {"id": 0, "name": file.filename}}

@app.post("/api/upload-batch")
async def upload_batch(files: list[UploadFile] = File(...)):
    saved = []
    for file in files:
        path = os.path.join(RESUME_DIR, file.filename)
        content = await file.read()
        with open(path, "wb") as f: 
            f.write(content)
        saved.append({"name": file.filename})
    return {"message": f"Successfully received {len(saved)} resumes. Engine is extracting data.", "results": saved}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)