"""
database.py — SQLite database with SQLAlchemy ORM (optimized for 1M+ resumes)
Uses WAL mode and extended timeouts to prevent locking crashes.
"""
import os
import sqlite3
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime, Index as SqlIndex, event, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "resumes.db")

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False, "timeout": 60},
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-128000")  
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.execute("PRAGMA mmap_size=536870912") 
    cursor.close()

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, default="Unknown")
    email = Column(String, default="")
    phone = Column(String, default="")
    location = Column(String, default="")
    education = Column(String, default="")
    
    # --- EXPERINCE TRACKING ---
    experience_years = Column(Float, default=0.0)
    relevant_experience_years = Column(Float, default=0.0) # NEW
    total_gap_years = Column(Float, default=0.0)           # NEW
    
    skills = Column(Text, default="[]")
    summary = Column(Text, default="")
    raw_text = Column(Text, default="")
    embedding_id = Column(Integer, default=-1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    score = Column(Float, default=0.0)
    
    hyperlinks = Column(Text, default="[]")       
    certificates = Column(Text, default="[]")     
    has_image = Column(Integer, default=0)         
    font_info = Column(Text, default="{}")         
    page_count = Column(Integer, default=1)
    word_count = Column(Integer, default=0)
    file_hash = Column(String, default="", index=True)         

    fraud_flag = Column(Integer, default=0)        
    fraud_reason = Column(String, default="")      
    impact_score = Column(Float, default=0.0)      
    fake_full_stack = Column(Boolean, default=False)
    open_source = Column(Boolean, default=False)

    __table_args__ = (
        SqlIndex("idx_skills", "skills"),
        SqlIndex("idx_location", "location"),
        SqlIndex("idx_experience", "experience_years"),
    )

def auto_migrate_db():
    if not os.path.exists(DB_PATH): return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(resumes)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "fraud_flag" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN fraud_flag INTEGER DEFAULT 0")
    if "fraud_reason" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN fraud_reason TEXT DEFAULT ''")
    if "impact_score" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN impact_score FLOAT DEFAULT 0.0")
    if "fake_full_stack" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN fake_full_stack BOOLEAN DEFAULT 0")
    if "open_source" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN open_source BOOLEAN DEFAULT 0")
    
    # --- AUTO MIGRATE NEW COLUMNS SO NO DATA IS LOST ---
    if "relevant_experience_years" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN relevant_experience_years FLOAT DEFAULT 0.0")
    if "total_gap_years" not in columns: cursor.execute("ALTER TABLE resumes ADD COLUMN total_gap_years FLOAT DEFAULT 0.0")
    
    conn.commit()
    conn.close()

def init_db():
    auto_migrate_db()
    Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()