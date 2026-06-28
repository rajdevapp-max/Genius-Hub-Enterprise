"""
embedder.py — Batch-Optimized FAISS Vector Search v8.0
Supports batch embedding for 1M+ resumes.
Uses sentence-transformers locally.
Includes Memory-to-Disk Batch Saving to prevent I/O throttling.
"""
import os
import json
import numpy as np
import faiss
import threading
from typing import Optional

model = None
USE_LOCAL = True 

def load_local_model():
    global model, USE_LOCAL
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer("all-MiniLM-L6-v2")
            USE_LOCAL = True
            print("[embedder] ✓ Local model loaded (all-MiniLM-L6-v2)")
        except Exception:
            USE_LOCAL = False
            print("[embedder] ⚠ Local model unavailable, using HF API")

import requests

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_EMBED_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

EMBEDDING_DIM = 384
INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.json"


class ResumeIndex:
    """FAISS-based vector index optimized for massive scale (1M+)."""

    def __init__(self):
        self.index = None
        self.metadata: list[dict] = []
        self._id_map: dict[int, int] = {}  # resume_id -> faiss_idx
        self._save_lock = threading.Lock()
        self._unsaved_changes = 0
        self._load()

    def _create_index(self):
        """Create optimized index based on expected size."""
        # For 1M+ we use IVF, but FlatIP is fine for < 100k
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)

    def _load(self):
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            try:
                self.index = faiss.read_index(INDEX_PATH)
                with open(META_PATH, "r") as f:
                    self.metadata = json.load(f)
                # Rebuild ID map
                for i, m in enumerate(self.metadata):
                    self._id_map[m.get("id", i)] = i
                print(f"[embedder] Loaded {self.index.ntotal} vectors from disk.")
            except Exception as e:
                print(f"[embedder] Index load error: {e}")
                self._create_index()
        else:
            self._create_index()

    def _save(self, force=False):
        """Saves to disk. Only actually writes if forced or if > 500 unsaved changes to prevent I/O crashing."""
        with self._save_lock:
            if not force and self._unsaved_changes < 500:
                return
            
            try:
                faiss.write_index(self.index, INDEX_PATH)
                with open(META_PATH, "w") as f:
                    json.dump(self.metadata, f)
                self._unsaved_changes = 0
            except Exception as e:
                print(f"[embedder] Error saving index: {e}")

    def embed(self, text: str) -> np.ndarray:
        if USE_LOCAL:
            return model.encode([text], normalize_embeddings=True)[0]
        try:
            resp = requests.post(
                HF_EMBED_URL, headers=HEADERS,
                json={"inputs": text[:1000], "options": {"wait_for_model": True}},
                timeout=30,
            )
            if resp.status_code == 200:
                vec = np.array(resp.json()[0], dtype=np.float32)
                if vec.ndim == 2: vec = vec.mean(axis=0)
                vec = vec / (np.linalg.norm(vec) + 1e-9)
                return vec
        except Exception as e:
            print(f"[embedder] API error: {e}")
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        """Batch embed for speed (10-50x faster than one-by-one)."""
        if USE_LOCAL:
            return model.encode(texts, normalize_embeddings=True, batch_size=256, show_progress_bar=False)
        return np.array([self.embed(t) for t in texts], dtype=np.float32)

    def add(self, resume_id: int, text: str, meta: dict, force_save=False) -> int:
        vec = self.embed(text)
        self.index.add(np.array([vec], dtype=np.float32))
        idx = self.index.ntotal - 1
        self.metadata.append({"id": resume_id, **meta})
        self._id_map[resume_id] = idx
        
        self._unsaved_changes += 1
        self._save(force=force_save)
        return idx

    def add_batch(self, items: list[dict]) -> list[int]:
        """Batch add multiple resumes at once."""
        if not items:
            return []
        texts = [item["text"] for item in items]
        vecs = self.embed_batch(texts)
        
        start_idx = self.index.ntotal
        self.index.add(np.array(vecs, dtype=np.float32))
        
        indices = []
        for i, item in enumerate(items):
            idx = start_idx + i
            meta = {k: v for k, v in item.items() if k != "text"}
            self.metadata.append(meta)
            self._id_map[meta.get("id", idx)] = idx
            indices.append(idx)
        
        self._unsaved_changes += len(items)
        self._save(force=True) # Always force save at the end of a large batch
        return indices

    def remove(self, resume_id: int):
        """Mark a resume as removed (rebuild index periodically)."""
        if resume_id in self._id_map:
            idx = self._id_map[resume_id]
            if idx < len(self.metadata):
                self.metadata[idx] = {"id": -1, "deleted": True}
            del self._id_map[resume_id]
            self._unsaved_changes += 1
            self._save(force=False)

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        if self.index is None or self.index.ntotal == 0:
            return []
        vec = self.embed(query)
        k = min(top_k * 2, self.index.ntotal)  # over-fetch to filter deleted
        scores, indices = self.index.search(np.array([vec], dtype=np.float32), k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            entry = self.metadata[idx]
            if entry.get("deleted") or entry.get("id", -1) == -1:
                continue
            result = entry.copy()
            result["similarity"] = float(score)
            results.append(result)
            if len(results) >= top_k:
                break
        return results

    def rebuild(self, items: list[dict]):
        """Full rebuild of the index (call after many deletions)."""
        self._create_index()
        self.metadata = []
        self._id_map = {}
        self._unsaved_changes = 0
        if items:
            self.add_batch(items)
        print(f"[embedder] Rebuilt index with {len(items)} entries")

    @property
    def total(self) -> int:
        if self.index is None:
            return 0
        return sum(1 for m in self.metadata if not m.get("deleted"))

    def force_save_to_disk(self):
        """Explicitly called by watcher when queue is empty."""
        self._save(force=True)

resume_index = ResumeIndex()