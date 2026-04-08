"""
rebuilder.py — Mass Reprocessing Engine v7.0 (Micro-Batching Ultimate Speed)
Features: 16-Core Multithreading, 50-file Micro-Batches to prevent RAM jerks, and Auto-Checkpoint.
"""
import os
import time
import sys
import concurrent.futures
from database import SessionLocal, Resume, init_db
from embedder import resume_index
from extractor import process_resume

RESUME_DIR = os.environ.get("RESUME_DIR", "resumes")

def rebuild_database():
    print("🚨 STARTING MASS AI REBUILD (V7 ULTIMATE SPEED) 🚨", flush=True)
    db = SessionLocal()
    
    success = 0
    failed = 0
    
    try:
        # 1. THE CHECKPOINT SYSTEM
        print("🔍 Checking database for existing progress...", flush=True)
        existing_filenames = {r[0] for r in db.query(Resume.filename).all()}
        
        all_files = [f for f in os.listdir(RESUME_DIR) if f.lower().endswith(('.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'))]
        files_to_process = [f for f in all_files if f not in existing_filenames]
        total = len(files_to_process)
        
        if total == 0:
            print("\n✅ All resumes processed! Nothing left to do.", flush=True)
            return
            
        # 2. THE 16-CORE SWEET SPOT
        optimal_threads = min(16, (os.cpu_count() or 4) * 2) 
        print(f"🚀 Launching {optimal_threads}-Core AI Engine...", flush=True)
        
        start_time = time.time()
        
        # 3. MICRO-BATCHING (Fixes the jerks and maximizes speed)
        CHUNK_SIZE = 50 
        
        for i in range(0, total, CHUNK_SIZE):
            chunk = files_to_process[i:i + CHUNK_SIZE]
            
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=optimal_threads) as executor:
                    # Submit all 50 files instantly
                    future_to_file = {executor.submit(process_resume, os.path.join(RESUME_DIR, filename)): filename for filename in chunk}
                    
                    for j, future in enumerate(concurrent.futures.as_completed(future_to_file)):
                        filename = future_to_file[future]
                        try:
                            res = future.result()
                            if "error" in res:
                                failed += 1
                                print(f"   [⚠️] FAILED: {filename} - {res['error'][:50]}", flush=True)
                            else:
                                success += 1
                                print(f"   [✓] {i + j + 1}/{total} | Parsed: {filename}", flush=True)
                        except Exception as e:
                            failed += 1
                            print(f"   [⚠️] CRASHED: {filename} - {str(e)[:50]}", flush=True)
                            
            except KeyboardInterrupt:
                raise KeyboardInterrupt

            # Instant RAM Flush to Disk
            if hasattr(resume_index, 'force_save_to_disk'):
                resume_index.force_save_to_disk()
            
            elapsed = round(time.time() - start_time, 2)
            speed = round((success + failed) / elapsed, 2) if elapsed > 0 else 0
            print(f"⚡ Micro-Batch Saved! (Current Speed: ~{speed} resumes/sec)", flush=True)

        print("\n🎉 MASS REBUILD COMPLETE!", flush=True)
        print(f"Total Perfectly Extracted: {success} | Total Failed: {failed}", flush=True)
        print("Your AI is now fully trained and ready for Hugging Face. 🚀", flush=True)

    # 4. THE GRACEFUL SHUTDOWN (Ctrl+C Trap)
    except KeyboardInterrupt:
        print("\n\n🛑 [PAUSED] Ctrl+C detected! Stopping AI engine safely...", flush=True)
        if hasattr(resume_index, 'force_save_to_disk'):
            resume_index.force_save_to_disk()
        print("💾 All progress has been saved securely to disk.", flush=True)
        print("👋 We can continue later! Just run `python rebuilder.py` again.", flush=True)
        sys.exit(0)
        
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    rebuild_database()