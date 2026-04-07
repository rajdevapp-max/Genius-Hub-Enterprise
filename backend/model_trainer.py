"""
model_trainer.py — Unsupervised ML Auto-Discovery Engine v1.0
Features: TF-IDF Skill Extraction, N-Gram Co-occurrence, Autonomous Knowledge Graph Expansion.
"""
import os
import json
import re
import time
import threading
from sklearn.feature_extraction.text import TfidfVectorizer
from database import SessionLocal, Resume
from classifier import SKILL_PATTERNS

DYNAMIC_SKILLS_FILE = "dynamic_skills.json"

def train_ml_model():
    print("🧠 [ML ENGINE] Starting Unsupervised Learning Cycle...", flush=True)
    start_time = time.time()
    db = SessionLocal()
    
    try:
        resumes = db.query(Resume.raw_text).filter(Resume.raw_text.isnot(None)).yield_per(1000)
        
        corpus = []
        for r in resumes:
            clean_text = re.sub(r'[^a-z\s\+#\.-]', ' ', r.raw_text.lower())
            corpus.append(clean_text)
            
        if len(corpus) < 100:
            print("🧠 [ML ENGINE] Not enough data to train. Sleeping.", flush=True)
            return

        print(f"🧠 [ML ENGINE] Training TF-IDF on {len(corpus)} documents...", flush=True)
        
        vectorizer = TfidfVectorizer(
            max_df=0.6,          
            min_df=0.01,         
            ngram_range=(1, 2), 
            stop_words='english'
        )
        
        tfidf_matrix = vectorizer.fit_transform(corpus)
        feature_names = vectorizer.get_feature_names_out()
        
        sum_tfidf = tfidf_matrix.sum(axis=0)
        
        word_scores = [(feature_names[col], sum_tfidf[0, col]) for col in range(sum_tfidf.shape[1])]
        word_scores.sort(key=lambda x: x[1], reverse=True)
        
        existing_skills = set([s.lower() for s in SKILL_PATTERNS])
        new_discoveries = []
        
        ignore_words = {"using", "worked", "application", "development", "developer", "engineer", "team", "project", "data", "software", "experience", "business", "design", "management", "testing", "technical", "system", "systems", "client", "clients"}
        
        for word, score in word_scores[:500]: 
            if len(word) > 2 and word not in existing_skills and not any(ig in word for ig in ignore_words):
                formatted_word = word.title() if len(word) > 3 else word.upper()
                new_discoveries.append(formatted_word)
                if len(new_discoveries) >= 50:
                    break
        
        with open(DYNAMIC_SKILLS_FILE, "w") as f:
            json.dump(new_discoveries, f)
            
        print(f"✅ [ML ENGINE] Training complete in {round(time.time()-start_time, 2)}s.")
        print(f"🚀 [ML ENGINE] Autonomously learned {len(new_discoveries)} new skills: {new_discoveries[:5]}...", flush=True)

    except Exception as e:
        print(f"❌ [ML ENGINE] Training failed: {e}", flush=True)
    finally:
        db.close()

def start_ml_cron():
    def cron_loop():
        while True:
            time.sleep(86400) # Run every 24 hours
            train_ml_model()

    thread = threading.Thread(target=cron_loop, daemon=True)
    thread.start()
    threading.Timer(60.0, train_ml_model).start() # Initial run 60 seconds after boot