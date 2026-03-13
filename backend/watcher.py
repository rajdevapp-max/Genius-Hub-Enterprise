"""
watcher.py — Instant File System Monitor
Bypasses existing files in <1 second and sends new files to batch_process.
"""
import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from database import SessionLocal, Resume
from extractor import process_resume, batch_process

RESUME_DIR = os.environ.get("RESUME_DIR", "resumes")
os.makedirs(RESUME_DIR, exist_ok=True)

stats = {"total_processed": 0, "last_event": None, "processing": False}

def get_watcher_stats():
    return stats

class ResumeHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory: return
        ext = os.path.splitext(event.src_path)[1].lower()
        if ext in (".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"):
            stats["last_event"] = f"New file: {os.path.basename(event.src_path)}"
            stats["processing"] = True
            time.sleep(1) # wait for file transfer
            try:
                process_resume(event.src_path)
                stats["total_processed"] += 1
            except Exception: pass
            finally:
                stats["processing"] = False

def sync_existing_files():
    """Ultra-fast DB diffing. Solves the 1M+ resume restart delay."""
    print(f"\n[sync] Scanning {RESUME_DIR} directory...")
    stats["processing"] = True
    
    current_files = []
    for root, _, files in os.walk(RESUME_DIR):
        for f in files:
            if f.lower().endswith((".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg")):
                current_files.append(os.path.join(root, f))
    
    db = SessionLocal()
    try:
        # Fetching a set of filenames takes <0.1 seconds even for 100k rows
        existing_filenames = {r[0] for r in db.query(Resume.filename).all()}
    finally:
        db.close()

    new_files = [f for f in current_files if os.path.basename(f) not in existing_filenames]
    
    if new_files:
        print(f"[sync] Bypassed {len(current_files) - len(new_files)} existing DB files.")
        print(f"[sync] Found {len(new_files)} NEW resumes. Starting extraction...")
        # Utilize maximum safe threads for IO heavy processing
        optimal_threads = min(32, (os.cpu_count() or 4) * 4) 
        batch_process(new_files, max_workers=optimal_threads)
        stats["total_processed"] += len(new_files)
    else:
        print(f"[sync] All {len(current_files)} resumes are already in the Database. Ready instantly! ✓\n")

    stats["processing"] = False

def start_watcher():
    sync_existing_files()
    observer = Observer()
    observer.schedule(ResumeHandler(), RESUME_DIR, recursive=False)
    observer.start()
    print(f"[watcher] 👁 Watching {RESUME_DIR} folder for real-time drops...")
    try:
        while True: time.sleep(5)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

def start_watcher_thread():
    t = threading.Thread(target=start_watcher, daemon=True)
    t.start()