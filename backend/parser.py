"""
parser.py — Enhanced Resume Parser v14.1
Extracts text, hyperlinks, images, fonts, certificates, and DEEP PDF/DOCX TABLES.
"""
import os
import re
import hashlib
import zipfile
import fitz
import pdfplumber
from docx import Document
from PIL import Image
import io

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

def file_hash(file_path: str) -> str:
    h = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def extract_text_from_pdf(file_path: str) -> dict:
    result = {"text": "", "hyperlinks": [], "fonts": {}, "has_image": False, "page_count": 0, "fraud_flag": 0, "fraud_reason": ""}
    try:
        doc = fitz.open(file_path)
        result["page_count"] = len(doc)
        all_text = []
        MAX_PAGES = 10 
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages[:MAX_PAGES]:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            # 🎯 THE FIX: Replace \n with | to separate merged table cells safely!
                            row_text = " | ".join([str(cell).replace('\n', ' | ').strip() for cell in row if cell])
                            if row_text: all_text.append(row_text)
        except: pass

        for page_num in range(min(len(doc), MAX_PAGES)):
            page = doc[page_num]
            for link in page.get_links():
                uri = link.get("uri", "")
                if uri and uri.startswith("http"): result["hyperlinks"].append(uri)
            
            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: (round(b[1], -1), b[0]))
            page_text = [b[4].strip() for b in blocks if b[6] == 0 and b[4].strip()]
            full_page_text = "\n".join(page_text)
            all_text.append(full_page_text)
            
            dict_blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
            for block in dict_blocks.get("blocks", []):
                if block.get("type") == 0:
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            color = span.get("color", 0)
                            if color == 16777215 and span.get("text", "").strip():
                                result["fraud_flag"] = 1
                                result["fraud_reason"] = "Detected invisible (white) text. Potential keyword stuffing fraud."
                            
                            font_name = span.get("font", "unknown")
                            size = span.get("size", 0)
                            if font_name not in result["fonts"]: result["fonts"][font_name] = {"sizes": set(), "count": 0}
                            result["fonts"][font_name]["sizes"].add(round(size, 1))
                            result["fonts"][font_name]["count"] += 1
                elif block.get("type") == 1: 
                    result["has_image"] = True
            
            if len(full_page_text.strip()) < 50:
                for img_info in page.get_images(full=True):
                    try:
                        base_img = doc.extract_image(img_info[0])
                        if base_img and HAS_TESSERACT:
                            ocr_text = pytesseract.image_to_string(Image.open(io.BytesIO(base_img["image"])), timeout=15)
                            if ocr_text.strip(): all_text.append(ocr_text)
                    except Exception as ocr_e:
                        pass
        doc.close()

        result["text"] = "\n".join(all_text).strip()
        
        serialized_fonts = {}
        for fname, fdata in result["fonts"].items():
            serialized_fonts[fname] = {"sizes": sorted(list(fdata["sizes"])), "count": fdata["count"]}
        result["fonts"] = serialized_fonts

    except Exception as e:
        print(f"\n[parser] Broken PDF detected ({os.path.basename(file_path)}). Initiating Salvage...")
        try:
            with pdfplumber.open(file_path) as pdf:
                result["page_count"] = len(pdf.pages)
                extracted_text = []
                for i, page in enumerate(pdf.pages):
                    if i >= 10: break 
                    text = page.extract_text()
                    if text: extracted_text.append(text)
                result["text"] = "\n".join(extracted_text)
        except Exception as salvage_e:
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                    strings = re.findall(b'[a-zA-Z0-9\s,\.\-\@\+]{5,}', content)
                    result["text"] = " ".join([s.decode('ascii', errors='ignore') for s in strings])
            except Exception as bin_e:
                pass
    return result

def extract_text_from_docx(file_path: str) -> dict:
    result = {"text": "", "hyperlinks": [], "fonts": {}, "has_image": False, "page_count": 1, "fraud_flag": 0, "fraud_reason": ""}
    try:
        doc = Document(file_path)
        texts = []
        table_texts = []
        font_set = {}
        
        for table in doc.tables:
            for row in table.rows:
                row_data = []
                for cell in row.cells:
                    # 🎯 THE FIX: Replace \n with | to separate merged table cells safely!
                    clean_cell = cell.text.strip().replace('\n', ' | ')
                    if clean_cell and clean_cell not in row_data: 
                        row_data.append(clean_cell)
                if row_data:
                    table_texts.append(" | ".join(row_data))
        
        MAX_PARAGRAPHS = 500
        for i, para in enumerate(doc.paragraphs):
            if i > MAX_PARAGRAPHS: break
            if para.text.strip():
                texts.append(para.text)
            for run in para.runs:
                if run.font.color and run.font.color.rgb and str(run.font.color.rgb) == "FFFFFF" and run.text.strip():
                    result["fraud_flag"] = 1; result["fraud_reason"] = "Detected invisible (white) text in Word Document."
                fname = run.font.name or "default"
                fsize = run.font.size.pt if run.font.size else 0
                if fname not in font_set: font_set[fname] = {"sizes": set(), "count": 0}
                font_set[fname]["sizes"].add(round(fsize, 1)); font_set[fname]["count"] += 1
        
        for para in doc.paragraphs:
            for elem in para._element.iter():
                if elem.tag.endswith("}hyperlink"):
                    rid = elem.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                    if rid and rid in doc.part.rels:
                        url = doc.part.rels[rid].target_ref
                        if url and url.startswith("http"): result["hyperlinks"].append(url)
        
        for rel in doc.part.rels.values():
            if "image" in rel.reltype: result["has_image"] = True; break
        
        final_text = table_texts + texts
        result["text"] = "\n".join(final_text).strip()
        result["fonts"] = {fname: {"sizes": sorted(list(fdata["sizes"])), "count": fdata["count"]} for fname, fdata in font_set.items()}
        
    except Exception as e:
        ext = os.path.splitext(file_path)[1].lower()
        print(f"[parser] Corrupted or legacy file detected ({os.path.basename(file_path)}). Initiating Salvage...")
        try:
            if ext == ".docx":
                with zipfile.ZipFile(file_path) as docx_zip:
                    xml_content = docx_zip.read('word/document.xml').decode('utf-8')
                    result["text"] = " ".join(re.findall(r'<w:t(?:.*?)>(.*?)</w:t>', xml_content))
            elif ext == ".doc":
                with open(file_path, 'rb') as f:
                    content = f.read()
                    strings = re.findall(b'[a-zA-Z0-9\s,\.\-\@\+]{5,}', content)
                    result["text"] = " ".join([s.decode('ascii', errors='ignore') for s in strings])
        except Exception as salvage_e:
            pass
    return result

def extract_text_from_image(file_path: str) -> dict:
    result = {"text": "", "hyperlinks": [], "fonts": {}, "has_image": True, "page_count": 1, "fraud_flag": 0, "fraud_reason": ""}
    if not HAS_TESSERACT: return result
    try:
        result["text"] = pytesseract.image_to_string(Image.open(file_path), timeout=20).strip()
    except Exception as e: 
        pass
    return result

def extract_full(file_path: str) -> dict:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf": data = extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"): data = extract_text_from_docx(file_path)
    elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"): data = extract_text_from_image(file_path)
    else: return {"text": "", "hyperlinks": [], "fonts": {}, "has_image": False, "page_count": 0, "fraud_flag": 0, "fraud_reason": ""}
    
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    data["hyperlinks"] = list(set(data.get("hyperlinks", []) + re.findall(url_pattern, data["text"])))
    data["file_hash"] = file_hash(file_path)
    data["word_count"] = len(data["text"].split())
    return data

def extract_text(file_path: str) -> str: return extract_full(file_path)["text"]

def calculate_visual_score(text: str, metadata: dict = None) -> float:
    score = 40.0
    metadata = metadata or {}
    
    word_count = len(text.split())
    if word_count > 200: score += 5
    if word_count > 400: score += 5
    if 500 <= word_count <= 1200: score += 5 
    
    sections = ["experience", "education", "skills", "projects", "summary", "objective", "certifications"]
    score += sum(1 for s in sections if s in text.lower()) * 2.5
    
    if re.search(r'[\w.-]+@[\w.-]+\.\w+', text): score += 5
    if re.search(r'\+?\d[\d\s-]{8,}', text): score += 3
    
    link_text = " ".join(metadata.get("hyperlinks", [])).lower() + " " + text.lower()
    if "linkedin" in link_text: score += 4
    if "github" in link_text: score += 4
    if "portfolio" in link_text or "personal" in link_text: score += 3
    
    score += min(sum(1 for c in ["certified", "certification", "aws certified", "pmp"] if c in text.lower()) * 2, 8)
    
    fonts = metadata.get("fonts", {})
    if len(fonts) > 5: score -= 3
    elif 2 <= len(fonts) <= 4: score += 3 
    if metadata.get("has_image"): score -= 2
    
    pages = metadata.get("page_count", 1)
    if pages == 1: score += 3
    elif pages == 2: score += 2
    elif pages > 3: score -= 3
    
    score += min(sum(1 for v in ["developed", "managed", "led", "created", "optimized"] if v in text.lower()) * 1.5, 10)
    score += min(len(re.findall(r'\d+%|\$\d+|#\d+|\d+x', text)) * 2, 8)
    return min(max(score, 10.0), 98.0)

def extract_certificates(text: str) -> list:
    certs = []
    cert_patterns = [r'(?:AWS|Amazon)\s+Certified\s+[\w\s-]+', r'(?:Google|GCP)\s+(?:Cloud\s+)?Certified\s+[\w\s-]+', r'(?:Azure|Microsoft)\s+Certified\s*:?\s*[\w\s-]+', r'PMP\b', r'CSM\b', r'CISSP\b', r'(?:Cisco|CCNA|CCNP|CCIE)[\w\s]*']
    for pat in cert_patterns: certs.extend([m.strip() for m in re.findall(pat, text, re.IGNORECASE)])
    return list(set(certs))