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
_model_lock = threading.Lock()

def load_local_model():
    global model, USE_LOCAL
    with _model_lock:
        if model is None and USE_LOCAL:
            try:
                from sentence_transformers import SentenceTransformer
                model = SentenceTransformer("all-MiniLM-L6-v2")
                USE_LOCAL = True
                print("[embedder] ✓ Local model loaded (all-MiniLM-L6-v2)", flush=True)
            except Exception as e:
                try:
                    # Same model on ONNX (~200MB RAM vs ~600MB with torch) for small hosts like Render free.
                    from fastembed import TextEmbedding
                    model = _FastEmbedModel(TextEmbedding("sentence-transformers/all-MiniLM-L6-v2"))
                    USE_LOCAL = True
                    print("[embedder] ✓ Local ONNX model loaded (fastembed all-MiniLM-L6-v2)", flush=True)
                except Exception as e2:
                    USE_LOCAL = False
                    print(f"[embedder] ⚠ Local model unavailable ({e}; {e2}), using HF API", flush=True)

class _FastEmbedModel:
    """Adapter exposing the SentenceTransformer.encode() subset we use."""
    def __init__(self, inner):
        self.inner = inner

    def encode(self, texts, normalize_embeddings=True, batch_size=64, show_progress_bar=False):
        vecs = np.array(list(self.inner.embed(list(texts), batch_size=batch_size)), dtype=np.float32)
        if normalize_embeddings:
            vecs = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9)
        return vecs

import requests

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_EMBED_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

EMBEDDING_DIM = 384
INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.json"


def build_embedding_text(name: str, location: str, skills: list, raw_text: str) -> str:
    """Single source of truth for what gets embedded per resume."""
    return f"{name or ''} {location or ''} {' '.join(skills or [])} {(raw_text or '')[:1000]}"


class ResumeIndex:
    """FAISS-based vector index optimized for massive scale (1M+)."""

    def __init__(self):
        self.index = None
        self.metadata: list[dict] = []
        self._id_map: dict[int, int] = {}  # resume_id -> faiss_idx
        self._save_lock = threading.Lock()
        self._index_lock = threading.RLock()  # FAISS add/search are not safe to interleave
        self._save_timer: Optional[threading.Timer] = None
        self._unsaved_changes = 0
        self._load()

    def _create_index(self):
        """Create optimized index based on expected size."""
        # For 1M+ we use IVF, but FlatIP is fine for < 100k
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)

    def _load(self):
        with self._index_lock:
            self.metadata = []
            self._id_map = {}
            if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
                try:
                    self.index = faiss.read_index(INDEX_PATH)
                    with open(META_PATH, "r") as f:
                        self.metadata = json.load(f)
                    if len(self.metadata) != self.index.ntotal:
                        # Index and metadata came from different snapshots: positions can't be trusted.
                        print(f"[embedder] ⚠ Index/meta mismatch ({self.index.ntotal} vectors vs {len(self.metadata)} meta). Starting fresh; reconcile will re-embed.", flush=True)
                        self._create_index()
                        self.metadata = []
                        return
                    for i, m in enumerate(self.metadata):
                        if not m.get("deleted") and m.get("id", -1) != -1:
                            self._id_map[m["id"]] = i
                    print(f"[embedder] Loaded {self.index.ntotal} vectors from disk.", flush=True)
                except Exception as e:
                    print(f"[embedder] Index load error: {e}", flush=True)
                    self._create_index()
                    self.metadata = []
            else:
                if os.path.exists(INDEX_PATH):
                    print("[embedder] ⚠ faiss_index.bin found without faiss_meta.json; ignoring it.", flush=True)
                self._create_index()

    def reload(self):
        """Re-read index files from disk (e.g. after a cloud sync replaced them)."""
        self._load()

    def _save(self, force=False):
        """Saves to disk. Only actually writes if forced or if > 500 unsaved changes to prevent I/O crashing."""
        with self._save_lock:
            if not force and self._unsaved_changes < 500:
                return
            if self._unsaved_changes == 0 and os.path.exists(INDEX_PATH):
                return

            try:
                with self._index_lock:
                    faiss.write_index(self.index, INDEX_PATH + ".tmp")
                    meta_snapshot = list(self.metadata)
                with open(META_PATH + ".tmp", "w") as f:
                    json.dump(meta_snapshot, f)
                os.replace(INDEX_PATH + ".tmp", INDEX_PATH)
                os.replace(META_PATH + ".tmp", META_PATH)
                self._unsaved_changes = 0
            except Exception as e:
                print(f"[embedder] Error saving index: {e}", flush=True)

    def schedule_save(self, delay: float = 10.0):
        """Debounced save so single uploads persist without rewriting the index on every file."""
        if self._save_timer is not None:
            self._save_timer.cancel()
        self._save_timer = threading.Timer(delay, self._save, kwargs={"force": True})
        self._save_timer.daemon = True
        self._save_timer.start()

    def embed(self, text: str) -> np.ndarray:
        if model is None and USE_LOCAL:
            load_local_model()
        if USE_LOCAL:
            return model.encode([text], normalize_embeddings=True)[0]
        try:
            resp = requests.post(
                HF_EMBED_URL, headers=HEADERS,
                json={"inputs": text[:1000], "options": {"wait_for_model": True}},
                timeout=30,
            )
            if resp.status_code == 200:
                vec = np.array(resp.json(), dtype=np.float32)
                while vec.ndim > 1: vec = vec.mean(axis=0)
                vec = vec / (np.linalg.norm(vec) + 1e-9)
                return vec
            print(f"[embedder] API error: {resp.status_code} {resp.text[:200]}", flush=True)
        except Exception as e:
            print(f"[embedder] API error: {e}", flush=True)
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        """Batch embed for speed (10-50x faster than one-by-one)."""
        if model is None and USE_LOCAL:
            load_local_model()
        if USE_LOCAL:
            return model.encode(texts, normalize_embeddings=True, batch_size=64, show_progress_bar=False)
        return np.array([self.embed(t) for t in texts], dtype=np.float32)

    def _mark_deleted(self, resume_id: int):
        idx = self._id_map.pop(resume_id, None)
        if idx is not None and idx < len(self.metadata):
            self.metadata[idx] = {"id": -1, "deleted": True}

    def add(self, resume_id: int, text: str, meta: dict, force_save=False) -> int:
        vec = self.embed(text)
        with self._index_lock:
            self._mark_deleted(resume_id)  # re-adding the same id must not leave a stale vector behind
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

        indices = []
        with self._index_lock:
            for item in items:
                if "id" in item: self._mark_deleted(item["id"])
            start_idx = self.index.ntotal
            self.index.add(np.array(vecs, dtype=np.float32))
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
        with self._index_lock:
            if resume_id not in self._id_map:
                return
            self._mark_deleted(resume_id)
            self._unsaved_changes += 1
        self._save(force=False)

    def indexed_ids(self) -> set[int]:
        with self._index_lock:
            return set(self._id_map.keys())

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        if self.index is None or self.index.ntotal == 0 or top_k <= 0:
            return []
        vec = self.embed(query)
        with self._index_lock:
            k = min(top_k * 2, self.index.ntotal)  # over-fetch to filter deleted
            scores, indices = self.index.search(np.array([vec], dtype=np.float32), k)
            metadata = self.metadata

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(metadata):
                continue
            entry = metadata[idx]
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
        with self._index_lock:
            self._create_index()
            self.metadata = []
            self._id_map = {}
            self._unsaved_changes = 1
        if items:
            self.add_batch(items)
        else:
            self._save(force=True)
        print(f"[embedder] Rebuilt index with {len(items)} entries", flush=True)

    @property
    def total(self) -> int:
        if self.index is None:
            return 0
        return len(self._id_map)

    def force_save_to_disk(self):
        """Explicitly called by watcher when queue is empty."""
        self._save(force=True)

resume_index = ResumeIndex()
