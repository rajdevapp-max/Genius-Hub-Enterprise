"""
dedup.py — Duplicate Resume Detection & Removal
Detects duplicates by content hash (MD5) — catches identical files
even with different filenames.
"""
import os
import json
from collections import defaultdict
from database import SessionLocal, Resume
from parser import file_hash

RESUME_DIR = os.environ.get("RESUME_DIR", "resumes")


def find_duplicates() -> list[dict]:
    """Find all duplicate resumes in DB by file_hash.
    Returns groups of duplicates with the 'keep' one (earliest created) marked.
    """
    db = SessionLocal()
    try:
        resumes = db.query(Resume).filter(Resume.file_hash != "").all()
        hash_groups = defaultdict(list)
        for r in resumes:
            if r.file_hash:
                hash_groups[r.file_hash].append({
                    "id": r.id,
                    "filename": r.filename,
                    "name": r.name,
                    "score": r.score,
                    "created_at": r.created_at.isoformat() if r.created_at else "",
                })

        duplicates = []
        for h, group in hash_groups.items():
            if len(group) > 1:
                # Keep the one with earliest created_at
                group.sort(key=lambda x: x["created_at"])
                duplicates.append({
                    "hash": h,
                    "count": len(group),
                    "keep": group[0],
                    "duplicates": group[1:],
                })
        return duplicates
    finally:
        db.close()


def remove_duplicates(dry_run: bool = False) -> dict:
    """Remove duplicate resumes, keeping the earliest entry for each hash.
    Also deletes duplicate files from disk.
    Returns stats about what was removed.
    """
    dupes = find_duplicates()
    removed = []
    errors = []

    if not dupes:
        return {"removed": 0, "groups": 0, "details": []}

    db = SessionLocal()
    try:
        for group in dupes:
            for dup in group["duplicates"]:
                if dry_run:
                    removed.append(dup)
                    continue
                try:
                    resume = db.query(Resume).get(dup["id"])
                    if resume:
                        # Remove from vector index
                        try:
                            from embedder import resume_index
                            resume_index.remove(resume.id)
                        except Exception:
                            pass
                        # Delete from DB
                        db.delete(resume)
                        # Delete file from disk
                        filepath = os.path.join(RESUME_DIR, resume.filename)
                        if os.path.exists(filepath):
                            os.remove(filepath)
                            print(f"[dedup] 🗑 Removed duplicate file: {resume.filename}")
                        removed.append(dup)
                except Exception as e:
                    errors.append({"filename": dup["filename"], "error": str(e)})

        if not dry_run:
            db.commit()
    finally:
        db.close()

    print(f"[dedup] ✓ Removed {len(removed)} duplicates from {len(dupes)} groups")
    return {
        "removed": len(removed),
        "groups": len(dupes),
        "errors": len(errors),
        "details": removed,
        "dry_run": dry_run,
    }


def scan_folder_duplicates() -> list[dict]:
    """Scan the resume folder for duplicate files by hash (before DB import).
    Useful for pre-processing cleanup.
    """
    hash_map = defaultdict(list)
    for root, dirs, files in os.walk(RESUME_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in (".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"):
                path = os.path.join(root, f)
                try:
                    h = file_hash(path)
                    hash_map[h].append({"filename": f, "path": path, "size": os.path.getsize(path)})
                except Exception:
                    pass

    duplicates = []
    for h, group in hash_map.items():
        if len(group) > 1:
            duplicates.append({
                "hash": h,
                "count": len(group),
                "files": group,
            })
    return duplicates
