"""
extractor.py — High-Speed PDF/DOCX Processing Engine
Features: Multi-threading (Windows Safe), DB Sync, Vector Embedding, Error Logging.
"""
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import json

from database import SessionLocal, Resume
from parser import extract_full, calculate_visual_score, extract_certificates
from classifier import classify_resume
from embedder import resume_index

def process_resume(file_path: str) -> dict:
    db = SessionLocal()
    try:
        filename = os.path.basename(file_path)
        existing = db.query(Resume).filter(Resume.filename == filename).first()
        if existing:
            return {"message": "Already processed", "id": existing.id, "name": existing.name}

        parsed_data = extract_full(file_path)
        raw_text = parsed_data.get("text", "")
        if not raw_text.strip():
            return {"error": f"Could not extract text from {filename}"}

        ai_data = classify_resume(raw_text)
        visual_score = calculate_visual_score(raw_text, parsed_data)
        certs = extract_certificates(raw_text)

        resume = Resume(
            filename=filename,
            name=ai_data["name"],
            email=ai_data["email"],
            phone=ai_data["phone"],
            location=ai_data["location"],
            education=ai_data["education"],
            
            # --- NEW DATA INJECTED HERE ---
            experience_years=ai_data.get("experience_years", 0.0),
            relevant_experience_years=ai_data.get("relevant_experience_years", 0.0),
            total_gap_years=ai_data.get("total_gap_years", 0.0),
            
            skills=json.dumps(ai_data["skills"]),
            summary=ai_data["summary"],
            raw_text=raw_text,
            score=visual_score,
            certificates=json.dumps(certs),
            hyperlinks=json.dumps(parsed_data.get("hyperlinks", [])),
            has_image=parsed_data.get("has_image", False),
            page_count=parsed_data.get("page_count", 1),
            word_count=parsed_data.get("word_count", 0),
            fraud_flag=parsed_data.get("fraud_flag", 0),
            fraud_reason=parsed_data.get("fraud_reason", ""),
            impact_score=ai_data.get("impact_score", 0.0),
            fake_full_stack=ai_data.get("fake_full_stack", False),
            open_source=bool("github.com" in "".join(parsed_data.get("hyperlinks", [])).lower() or "github" in raw_text.lower())
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        embedding_text = f"{ai_data['name']} {ai_data['location']} {' '.join(ai_data['skills'])} {raw_text[:1000]}"
        if hasattr(resume_index, 'add'):
            resume_index.add(resume.id, embedding_text, {})

        return {"message": "Success", "id": resume.id, "name": resume.name}
    
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Failed to process {file_path}: {str(e)}")
        return {"error": str(e)}
    finally:
        db.close()

def batch_process(file_paths: list[str], max_workers: int = 6) -> list[dict]:
    results = []
    safe_workers = min(max_workers, 6)
    
    print(f"\n[batch] Launching Multi-Core Engine ({safe_workers} threads - Windows Safe) for {len(file_paths)} files...")
    
    with ThreadPoolExecutor(max_workers=safe_workers) as executor:
        futures = {executor.submit(process_resume, path): path for path in file_paths}
        with tqdm(total=len(file_paths), desc="Processing Resumes", unit="res") as pbar:
            for future in as_completed(futures):
                try:
                    res = future.result()
                    results.append(res)
                except Exception as e:
                    print(f"\n[THREAD ERROR] {str(e)}")
                    results.append({"error": str(e)})
                pbar.update(1)
    
    if hasattr(resume_index, "force_save_to_disk"):
        resume_index.force_save_to_disk()
        
    return results