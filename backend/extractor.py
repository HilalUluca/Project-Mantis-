import io
import re
from PyPDF2 import PdfReader
import docx

def mask_pii(text: str) -> str:
    """
    Kişisel Verileri (PII) maskelemek için stratejik regex kalkanı.
    Gereksiz riskleri ortadan kaldırır.
    """
    if not text:
        return ""
    
    # TC Kimlik (11 haneli rakam)
    text = re.sub(r'\b\d{11}\b', '[MASKED_TCKN]', text)
    
    # Email
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[MASKED_EMAIL]', text)
    
    # Telefon (Basit formatlar)
    text = re.sub(r'\b0?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b', '[MASKED_PHONE]', text)
    
    return text

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """PDF dosyasından güvenli bir şekilde metin çıkarır."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PDF okuma hatası: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Word (.docx) dosyasından güvenli bir şekilde metin çıkarır."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        print(f"DOCX okuma hatası: {e}")
        return ""

def process_document(filename: str, file_bytes: bytes) -> dict:
    """
    Gelen dosyanın formatını analiz eder, metni çıkarır ve PII maskelemesi uygular.
    Herhangi bir eksik alana karşı varsayılan hata sözlüğü döner.
    """
    raw_text = ""
    
    if filename.lower().endswith('.pdf'):
        raw_text = extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith('.docx'):
        raw_text = extract_text_from_docx(file_bytes)
    else:
        return {
            "status": "error", 
            "message": "Desteklenmeyen dosya formatı. Sadece PDF ve DOCX.", 
            "text": ""
        }
        
    if not raw_text.strip():
        return {
            "status": "error", 
            "message": "Dosyadan metin çıkarılamadı veya dosya boş.", 
            "text": ""
        }
        
    # Güvenlik katmanını devreye sok
    masked_text = mask_pii(raw_text)
    
    return {
        "status": "success",
        "message": "Metin başarıyla çıkarıldı ve kişisel veriler maskelendi.",
        "original_length": len(raw_text),
        "text": masked_text
    }