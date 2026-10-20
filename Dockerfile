FROM python:3.10-slim

WORKDIR /app

# System deps: build tools + Tesseract so image/scanned resumes can be OCR'd
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

ENV HF_HOME=/app/.cache/huggingface \
    TOKENIZERS_PARALLELISM=false \
    PYTHONUNBUFFERED=1

# Copy requirements first to leverage cache correctly
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the embedding model into the image so cold starts don't download it
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the actual code into the WORKDIR
COPY backend/ .

# Create the resumes folder; HF Spaces runs as a non-root user, so the app dir must be writable
RUN mkdir -p resumes && chmod -R 777 /app

# Set Port 7860 - REQUIRED for Hugging Face
ENV PORT=7860
EXPOSE 7860

# Run using the factory-standard command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
