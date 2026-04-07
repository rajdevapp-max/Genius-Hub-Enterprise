"""
classifier.py — Universal Multi-AI NER & Skill Extraction v37.0 (Weighted Hierarchy)
Features: Flipped Name Voting Hierarchy (Email > Filename > Text) & Expanded Dictionary.
"""
import os
import re
import json
from typing import Optional
import datetime

STATE_MAPPING = {
    "al": "Alabama", "ak": "Alaska", "az": "Arizona", "ar": "Arkansas", "ca": "California", 
    "co": "Colorado", "ct": "Connecticut", "de": "Delaware", "fl": "Florida", "ga": "Georgia", 
    "hi": "Hawaii", "id": "Idaho", "il": "Illinois", "in": "Indiana", "ia": "Iowa", 
    "ks": "Kansas", "ky": "Kentucky", "la": "Louisiana", "me": "Maine", "md": "Maryland", 
    "ma": "Massachusetts", "mi": "Michigan", "mn": "Minnesota", "ms": "Mississippi", "mo": "Missouri", 
    "mt": "Montana", "ne": "Nebraska", "nv": "Nevada", "nh": "New Hampshire", "nj": "New Jersey", 
    "nm": "New Mexico", "ny": "New York", "nc": "North Carolina", "nd": "North Dakota", "oh": "Ohio", 
    "ok": "Oklahoma", "or": "Oregon", "pa": "Pennsylvania", "ri": "Rhode Island", "sc": "South Carolina", 
    "sd": "South Dakota", "tn": "Tennessee", "tx": "Texas", "ut": "Utah", "vt": "Vermont", 
    "va": "Virginia", "wa": "Washington", "wv": "West Virginia", "wi": "Wisconsin", "wy": "Wyoming"
}

SKILL_PATTERNS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "perl", "r programming", "shell", "bash", "unix shell",
    "dart", "lua", "haskell", "erlang", "elixir", "clojure", "groovy",
    "react", "angular", "vue", "svelte", "next.js", "nuxt", "gatsby", "jquery", "ajax", "json", "dom",
    "remix", "html", "css", "tailwind", "sass", "less", "bootstrap",
    "material ui", "chakra ui", "styled-components", "webpack", "vite",
    "node.js", "nodejs", "express", "fastapi", "django", "flask", "spring",
    "spring boot", "asp.net", ".net", "laravel", "rails",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci", "aks", "azure vm",
    "prometheus", "grafana", "datadog", "cloudflare",
    "vercel", "netlify", "heroku", "lambda", "ec2", "s3",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "dynamodb", "cassandra", "neo4j", "supabase", "firebase", "prisma", "pl/sql",
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch",
    "tensorflow", "scikit-learn", "pandas", "numpy", "spark", "hadoop",
    "airflow", "dbt", "snowflake", "databricks", "bigquery", "redshift",
    "power bi", "tableau", "opencv", "langchain", "llm", "rag",
    "transformers", "bert", "gpt", "hugging face", "mlflow", "sagemaker",
    "keras", "xgboost", "lightgbm", "scipy", "matplotlib", "streamlit",
    "bedrock", "aws bedrock", "generative ai", "genai", "claude", "openai", 
    "chatgpt", "anthropic", "llama", "stable diffusion", "midjourney",
    "jest", "mocha", "pytest", "junit", "cypress", "selenium", "playwright",
    "vitest", "testing library", "storybook",
    "kafka", "rabbitmq", "celery", "nats",
    "git", "linux", "unix", "ci/cd", "agile", "scrum", "jira",
    "figma", "rest api", "graphql", "grpc", "websocket", "oauth", "jwt",
    "microservices", "serverless", "event-driven", "clean architecture",
    "solidity", "web3", "blockchain", "ethereum",
    "react native", "flutter", "ios", "android", "swiftui",
    "excel", "matlab", "unity", "three.js",
    "stripe", "twilio", "auth0", "nginx", "apache", "c", "node", "underscore", "js",
    "ibm mdm", "websphere", "open liberty", "blue prism", "uipath", "automation anywhere", "rpa", "bmc remedy", "servicenow", "snow", "middleware"
]

ANTI_NAME_DICT = set(SKILL_PATTERNS + [
    "management", "wealth", "project", "server", "application", "system", "database", "developer", 
    "engineer", "analyst", "administrator", "technologies", "solutions", "summary", "experience", 
    "resume", "curriculum", "vitae", "cv", "profile", "page", "senior", "junior", "lead", "consultant", 
    "manager", "professional", "skills", "cloud", "data", "science", "architect", "software", 
    "development", "and", "libraries", "modules", "frameworks", "api", "platforms", "frontend", 
    "backend", "web", "app", "network", "agile", "scrum", "ui", "ux", "scripting", "programming", "tools", "service",
    "core", "competencies", "technical", "operating", "systems", "languages", "certification", "compliance",
    "protocols", "prevention", "attack", "flood", "syn", "icmp", "udp", "tcp", "forensic", "security",
    "threat", "modeling", "driver", "monitoring", "analysis", "information", "objective", "education",
    "insurance", "accelerator", "personal", "details", "contact", "overview", "portfolio", "github", "linkedin",
    "phone", "email", "mail", "address", "location", "city", "state", "zip", "country"
])

KNOWLEDGE_GRAPH = {
    "react": ["frontend", "javascript", "web development", "ui/ux"],
    "angular": ["frontend", "javascript", "typescript", "web development"],
    "vue": ["frontend", "javascript", "web development"],
    "django": ["backend", "python", "web development"],
    "fastapi": ["backend", "python", "api design"],
    "node.js": ["backend", "javascript", "server-side"],
    "nodejs": ["backend", "javascript", "server-side"],
    "docker": ["devops", "containerization"],
    "kubernetes": ["devops", "container orchestration", "cloud"],
    "aws": ["cloud computing", "infrastructure"],
    "azure": ["cloud computing", "infrastructure"],
    "gcp": ["cloud computing", "infrastructure"],
    "pytorch": ["deep learning", "machine learning", "artificial intelligence", "data science"],
    "tensorflow": ["deep learning", "machine learning", "artificial intelligence", "data science"],
    "pandas": ["data analysis", "data science", "python"],
    "sql": ["database", "backend", "data engineering"],
    "mongodb": ["nosql", "database", "backend"],
    "react native": ["mobile development", "frontend", "ios", "android"],
    "flutter": ["mobile development", "dart", "ios", "android"],
    "bedrock": ["aws", "generative ai", "cloud computing", "llm"],
    "aws bedrock": ["aws", "generative ai", "cloud computing", "llm"],
    "langchain": ["generative ai", "llm", "python"],
    "sagemaker": ["aws", "machine learning", "cloud computing"],
    "rpa": ["automation", "blue prism", "uipath", "automation anywhere"]
}

BACKEND_AND_DB_SKILLS = {
    "node.js", "nodejs", "express", "fastapi", "django", "flask", "spring", 
    "spring boot", "asp.net", ".net", "laravel", "rails", "python", "java", 
    "c#", "go", "ruby", "php", "sql", "postgresql", "mysql", "mongodb", "redis", 
    "elasticsearch", "dynamodb", "cassandra", "firebase", "supabase", "prisma",
    "backend", "server-side", "database", "perl", "shell", "bash"
}

def extract_impact_metrics(text: str) -> float:
    text_lower = text.lower()
    impact_score = 0.0
    action_verbs = r'(?:increased|reduced|improved|grew|optimized|decreased|achieved|saved|scaled)'
    metric_patterns = r'(?:\d+%)|(?:\$\d+[kmbKMB]?)|(?:\d+x)|(?:\d+\+?\s*(?:users|clients|requests|ms|seconds))'
    complex_pattern = rf'{action_verbs}[\w\s]{{0,50}}?{metric_patterns}'
    matches = re.findall(complex_pattern, text_lower)
    impact_score += len(matches) * 5.0
    return min(impact_score, 25.0)

def extract_skills_regex(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for skill in SKILL_PATTERNS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found.append(skill.title() if len(skill) > 3 else skill.upper())
    return found

def extract_all_skills(text: str) -> list[str]:
    all_skills = set(extract_skills_regex(text))
    normalized = set()
    for s in all_skills:
        clean = s.strip().lower()
        if len(clean) >= 2:
            title_case_skill = clean.title() if len(clean) > 3 else clean.upper()
            normalized.add(title_case_skill)
            if clean in KNOWLEDGE_GRAPH:
                for parent_skill in KNOWLEDGE_GRAPH[clean]:
                    normalized.add(parent_skill.title())
    return sorted(list(normalized))

def generate_summary(text: str) -> Optional[str]:
    clean_text = re.sub(r'\s+', ' ', text).strip()
    return clean_text[:300] + "..." if len(clean_text) > 300 else clean_text

def extract_email(text: str) -> str:
    match = re.search(r'[\w.-]+@[\w.-]+\.\w+', text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    match = re.search(r'(?:\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}', text)
    return match.group(0) if match else ""

def extract_name(text: str, filename: str = "", email: str = "") -> str:
    candidates = {}

    def add_candidate(name: str, score: int):
        clean = re.sub(r'[^a-zA-Z\s]', '', name).strip().title()
        if not clean or len(clean) < 3: return
        
        words = clean.lower().split()
        if any(w in ANTI_NAME_DICT for w in words): return
        
        candidates[clean] = candidates.get(clean, 0) + score

    lines = [l.strip() for l in text[:1500].split('\n') if l.strip()]
    for idx, line in enumerate(lines[:10]):
        chunks = re.split(r'[|,\t\-\–]', line)
        for chunk in chunks:
            chunk = chunk.strip()
            if '@' in chunk or re.search(r'\d{4,}', chunk) or 'linkedin' in chunk.lower() or 'github' in chunk.lower(): continue
            words = chunk.split()
            if 1 < len(words) <= 4:
                cap_count = sum(1 for w in words if w and w[0].isupper() and w.isalpha())
                if cap_count >= len(words) - 1:
                    score = 5 if idx < 3 else 3
                    add_candidate(chunk, score)

    if filename:
        clean_fn = re.sub(r'[\d_+\-\.]', ' ', filename).replace('pdf', '').replace('docx', '').replace('doc', '')
        words = [w for w in clean_fn.split() if len(w) > 2 and w.lower() not in ANTI_NAME_DICT]
        if words: 
            add_candidate(" ".join(words[:3]), 9)

    if email:
        prefix = email.split('@')[0].lower()
        parts = re.split(r'[._-]', prefix)
        clean_parts = [re.sub(r'[^a-zA-Z]', '', p).strip() for p in parts]
        valid_parts = [p for p in clean_parts if len(p) > 1 and p not in ANTI_NAME_DICT]
        
        if len(valid_parts) >= 2:
            add_candidate(f"{valid_parts[0]} {valid_parts[1]}", 10)
            add_candidate(f"{valid_parts[1]} {valid_parts[0]}", 10) 
        elif len(valid_parts) == 1:
            add_candidate(valid_parts[0], 6) 

    if not candidates:
        return "Unknown"
    
    best_match = max(candidates.items(), key=lambda x: x[1])
    return best_match[0]

def extract_location(text: str, phone: str = "") -> str:
    scores = {"USA": 0, "India": 0, "UK": 0, "Australia": 0, "Canada": 0}
    search_lower = text[:3000].lower() 
    best_exact_city = ""

    if phone:
        clean_phone = re.sub(r'[^\d+]', '', phone)
        if clean_phone.startswith("+1"): scores["USA"] += 10
        elif clean_phone.startswith("+91") or (clean_phone.startswith("91") and len(clean_phone) == 12): scores["India"] += 10
        elif clean_phone.startswith("+44"): scores["UK"] += 10
        elif clean_phone.startswith("+61"): scores["Australia"] += 10
        elif len(clean_phone) == 10:
            area_code = clean_phone[:3]
            us_high_area_codes = {"602","603","605","606","607","608","609","610","612","614","615","616","617","618","619","620","623","626","628","630","631","636","646","650","651","657","660","661","662","669","678","682","701","702","703","704","706","707","708","712","713","714","715","716","717","718","719","720","724","727","731","732","734","740","743","747","754","757","760","763","770","772","773","774","775","779","781","785","786","787","801","802","803","804","805","806","808","810","812","813","814","815","816","817","818","828","830","831","832","843","845","847","848","850","856","857","858","859","860","862","863","864","865","870","872","878","901","903","904","906","907","908","909","910","912","913","914","915","916","917","918","919","920","925","928","929","931","936","937","938","940","941","947","949","951","952","954","956","959","970","971","972","973","978","979","980","984","985","989"}
            if area_code in us_high_area_codes or area_code[0] in "2345": scores["USA"] += 8
            elif area_code[0] in "6789": scores["India"] += 8

    global_pat = r'(?:Location|Address|City|Based in|Located in|From)[:\s]+([A-Za-z\s,]{2,40})'
    global_match = re.search(global_pat, text[:1500], re.IGNORECASE)
    if global_match:
        extracted = global_match.group(1).strip().split('\n')[0][:50]
        blockers = {"pipeline", "server", "architecture", "data", "engineering", "platform"}
        if extracted and not any(b in extracted.lower() for b in blockers):
            best_exact_city = extracted
            if "india" in extracted.lower() or "ind" in extracted.lower(): scores["India"] += 9
            if "usa" in extracted.lower() or "us" in extracted.lower(): scores["USA"] += 9

    us_states_full = r'\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b'
    us_cities = r'\b(los angeles|chicago|houston|phoenix|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|san francisco|charlotte|indianapolis|seattle|denver|boston|el paso|nashville|detroit|oklahoma city|portland|las vegas|memphis|louisville|baltimore|milwaukee|albuquerque|tucson|fresno|sacramento|kansas city|mesa|atlanta|omaha|colorado springs|raleigh|miami|oakland|minneapolis|tulsa|bakersfield|wichita|arlington|ny|la|sf|west chester)\b'
    
    if re.search(r'\b([A-Z]{2})\s*(\d{5})\b', search_lower[:1500]) or re.search(us_states_full, search_lower) or re.search(us_cities, search_lower):
        scores["USA"] += 6

    india_cities = r'\b(mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|pune|gurgaon|gurugram|noida|kolkata|ahmedabad|kerala|maharashtra|karnataka|tamil nadu)\b'
    if re.search(india_cities, search_lower):
        scores["India"] += 6

    winner = max(scores.items(), key=lambda x: x[1])
    
    if winner[1] > 0:
        if best_exact_city and winner[0] not in best_exact_city:
            return f"{best_exact_city} ({winner[0]})"
        return winner[0]
    
    return ""

def extract_education(text: str) -> str:
    edu_keywords = [("Ph.D", "PhD"), ("Doctorate", "PhD"), ("Master", "Masters"), ("M.Tech", "M.Tech"), ("M.S.", "MS"), ("MBA", "MBA"), ("M.Sc", "MSc"), ("M.E.", "ME"), ("Bachelor", "Bachelors"), ("B.Tech", "B.Tech"), ("B.E.", "BE"), ("B.S.", "BS"), ("B.Sc", "BSc"), ("B.Com", "BCom"), ("BBA", "BBA"), ("BCA", "BCA"), ("Diploma", "Diploma"), ("Associate", "Associate")]
    for keyword, label in edu_keywords:
        if keyword.lower() in text.lower(): return label
    return ""

def analyze_experience(text: str) -> dict:
    fallback_exp = 0.0
    patterns = [r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)', r'(?:experience|exp)[:\s]*(\d+)\+?\s*(?:years?|yrs?)', r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of)', r'(?:total|overall)\s*(?:experience|exp)[:\s]*(\d+)']
    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match: 
            fallback_exp = float(match.group(1))
            break

    current_year = datetime.datetime.now().year
    date_ranges = re.findall(r'\b((?:19|20)\d{2})\s*(?:[-–]|to)\s*((?:19|20)\d{2}|present|current|now)\b', text, re.IGNORECASE)
    
    if not date_ranges:
        return {"total_experience": fallback_exp, "relevant_experience": fallback_exp, "total_gap_years": 0.0}
    
    intervals = []
    for start, end in date_ranges:
        try:
            s = int(start)
            e = current_year if end.lower() in ("present", "current", "now") else int(end)
            if 1980 <= s <= current_year and s <= e <= current_year + 1:
                intervals.append([s, e])
        except: pass
    
    if not intervals:
        return {"total_experience": fallback_exp, "relevant_experience": fallback_exp, "total_gap_years": 0.0}

    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        previous = merged[-1]
        if current[0] <= previous[1]: 
            previous[1] = max(previous[1], current[1])
        else:
            merged.append(current)
    
    relevant_exp = sum((iv[1] - iv[0]) for iv in merged)
    
    gaps = 0.0
    for i in range(1, len(merged)):
        gap_len = merged[i][0] - merged[i-1][1]
        if gap_len > 0: gaps += gap_len

    total_span = merged[-1][1] - merged[0][0] if merged else 0.0

    final_relevant = max(relevant_exp, fallback_exp) if relevant_exp == 0 else relevant_exp
    final_total = max(total_span, fallback_exp) if total_span == 0 else total_span

    return {
        "total_experience": float(final_total),
        "relevant_experience": float(final_relevant),
        "total_gap_years": float(gaps)
    }

def classify_resume(text: str, filename: str = "") -> dict:
    email = extract_email(text)
    name = extract_name(text, filename, email)
    
    all_skills = extract_all_skills(text)
    summary = generate_summary(text)
    impact_score = extract_impact_metrics(text)
    exp_data = analyze_experience(text)
    
    text_lower = text.lower()
    claims_full_stack = "full stack" in text_lower or "fullstack" in text_lower
    if claims_full_stack:
        skills_lower = [s.lower() for s in all_skills]
        has_backend_skills = any(skill in BACKEND_AND_DB_SKILLS for skill in skills_lower)
        if not has_backend_skills:
            impact_score -= 10.0 
            fake_full_stack = True
        else: fake_full_stack = False
    else: fake_full_stack = False

    return {
        "name": name,
        "email": email,
        "phone": extract_phone(text),
        "location": extract_location(text, extract_phone(text)),
        "education": extract_education(text),
        "experience_years": exp_data["total_experience"],
        "relevant_experience_years": exp_data["relevant_experience"],
        "total_gap_years": exp_data["total_gap_years"],
        "skills": all_skills,
        "impact_score": impact_score,
        "fake_full_stack": fake_full_stack,
        "summary": summary,
    }