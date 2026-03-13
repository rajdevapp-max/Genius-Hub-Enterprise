FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for AI/PDF processing
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage cache correctly
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual code into the WORKDIR
COPY backend/ .

# Create the resumes folder
RUN mkdir -p resumes

# Set Port 7860 - REQUIRED for Hugging Face
ENV PORT=7860
EXPOSE 7860

# Run using the factory-standard command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]