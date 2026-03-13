# Resume AI Intelligence Platform — Backend
# ==========================================
# Complete local backend with FREE AI APIs (HuggingFace Inference)
#
# FOLDER STRUCTURE:
# backend/
# ├── main.py            ← FastAPI entry point
# ├── database.py        ← SQLite + SQLAlchemy models
# ├── parser.py          ← Resume text extraction (PDF/DOCX/Images)
# ├── classifier.py      ← NER + skill extraction (GLiNER or HuggingFace free)
# ├── extractor.py       ← Structured data extraction pipeline
# ├── embedder.py        ← Sentence embeddings + FAISS vector search
# ├── watcher.py         ← Auto-watch folder for new resumes
# ├── requirements.txt   ← All dependencies
# └── resumes/           ← Drop resume files here
#
# SETUP STEPS (VS Code):
# =======================
# 1. Open terminal in VS Code
# 2. Create backend folder:
#      mkdir backend && cd backend
#
# 3. Create virtual environment:
#      python -m venv venv
#      # Windows:   venv\Scripts\activate
#      # Mac/Linux: source venv/bin/activate
#
# 4. Install dependencies:
#      pip install -r requirements.txt
#
# 5. Create resumes folder:
#      mkdir resumes
#
# 6. (Optional) Set HuggingFace token for better rate limits:
#      # Get FREE token at https://huggingface.co/settings/tokens
#      export HF_TOKEN=hf_your_free_token_here
#      # Windows: set HF_TOKEN=hf_your_free_token_here
#
# 7. Start the server:
#      uvicorn main:app --reload --port 8000
#
# 8. Open frontend in another terminal:
#      cd .. (back to root)
#      npm run dev
#
# 9. Drop PDF/DOCX resumes into the backend/resumes/ folder
#    The watcher auto-processes them!
#
# FREE AI APIS USED:
# ==================
# - HuggingFace Inference API (FREE, no credit card):
#     • Sentence embeddings: sentence-transformers/all-MiniLM-L6-v2
#     • NER: dslim/bert-base-NER
#     • Zero-shot classification: facebook/bart-large-mnli
# - FAISS (local, offline): Vector similarity search
# - PyMuPDF (local): PDF text extraction
# - python-docx (local): DOCX text extraction
# - Tesseract OCR (local, optional): Image-based resume extraction
