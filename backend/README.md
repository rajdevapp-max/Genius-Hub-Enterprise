# Resume AI Intelligence Platform v6.0

Enterprise-grade AI resume screening system with 80k+ resume processing, hybrid search, ATS ranking, duplicate detection, and auto-sync.

## 🚀 Complete Local Setup (Step by Step)

### Prerequisites
- **Python 3.10+** installed
- **Node.js 18+** installed
- **Tesseract OCR** (optional, for image resumes): `brew install tesseract` (Mac) or `apt install tesseract-ocr` (Linux)

### Step 1: Clone & Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

### Step 2: Configure API Keys (Optional but recommended)

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your FREE API keys:
# - Cerebras: https://cloud.cerebras.ai/
# - Together AI: https://api.together.ai/
# - Groq: https://console.groq.com/
# - Gemini: https://aistudio.google.com/apikey
# - HuggingFace: https://huggingface.co/settings/tokens
```

> **Note:** All APIs have FREE tiers. The system works without any keys (uses regex + spaCy), but accuracy improves dramatically with AI APIs.

### Step 3: Add Resumes

```bash
# Create the resumes folder (if not exists)
mkdir -p resumes

# Drop your PDF/DOCX/PNG/JPG resume files into this folder
# The system will auto-process them when the backend starts
```

### Step 4: Start Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

The backend will:
1. ✅ Load API keys from `.env`
2. ✅ Auto-process all resumes in `resumes/` folder
3. ✅ Detect and remove duplicate resumes
4. ✅ Start file watcher for real-time sync
5. ✅ Build FAISS vector index for semantic search

### Step 5: Start Frontend

```bash
# In a new terminal, from project root
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔄 Auto-Sync (No Restart Needed!)

- **Add resumes:** Just drop files into `backend/resumes/` → auto-indexed in seconds
- **Delete resumes:** Remove files from folder → auto-removed from DB & index
- **Modify resumes:** Update a file → auto-re-processed
- **Dashboard:** Auto-refreshes every 8 seconds

## 🔍 Features

| Feature | Description |
|---------|-------------|
| **Hybrid Search** | Name, filename, email, phone, skills + semantic AI search |
| **ATS Ranking** | Composite scoring with skill match, similarity, and base ATS |
| **Duplicate Detection** | MD5 hash-based dedup — catches identical files with different names |
| **Auto-Sync** | Watchdog monitors folder — no restart needed |
| **Multi-AI Analysis** | Cerebras, Together, Groq, Gemini, HuggingFace, spaCy, regex |
| **JD Matching** | Paste job description → ranked candidates with skill gaps |
| **Resume Preview** | View raw text inline without downloading |
| **Export CSV** | Export search results or all candidates |
| **Download** | Direct resume file download |
| **Delete** | Remove candidates from UI with file cleanup |
| **Autocomplete** | Real-time name/skill/location suggestions |
| **Bulk Upload** | Drag & drop multiple files at once |

## 📁 Files Updated

### Backend
- `main.py` — API server with dedup, preview, delete endpoints
- `classifier.py` — Multi-AI extraction with .env support
- `watcher.py` — Auto-sync with dedup on startup
- `dedup.py` — **NEW** Duplicate detection & removal engine
- `requirements.txt` — Added python-dotenv
- `.env.example` — **NEW** Template for API keys

### Frontend
- `src/lib/api.ts` — Added dedup, preview, delete API calls
- `src/components/CandidateModal.tsx` — Preview tab + delete button
- `src/pages/AnalyticsPage.tsx` — Duplicate stats + remove button
- `src/pages/SearchPage.tsx` — Delete callback from modal
- `src/pages/JDMatchPage.tsx` — Delete callback from modal
