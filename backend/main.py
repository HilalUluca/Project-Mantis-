import logging
import traceback
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from action_adapter import JiraAdapter, EmailAdapter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mantis.main")

# --- Onay Mekanizması (Agent Harness State) ---
db_approval_states: Dict[str, str] = {}

class ApprovalRequest(BaseModel):
    risk_id: str
    action: str  # "approve" veya "reject"

jira_adapter = JiraAdapter()
email_adapter = EmailAdapter()

class ActionDispatchRequest(BaseModel):
    action_type: str  # "jira" veya "email"
    title: str
    description: str
    recipient: Optional[str] = "Legal-Team"

# --- Modül yüklemeleri (Extractor, Auditor, Builder, RAG) ---
extractor_available = False
process_document = None

try:
    from extractor import process_document as _process_document
    process_document = _process_document
    extractor_available = True
    logger.info("extractor.py başarıyla yüklendi.")
except Exception:
    logger.error("EXTRACTOR YÜKLENEMEDİ:\n%s", traceback.format_exc())

Auditor = None
auditor_import_error: Optional[str] = None

try:
    from auditor import Auditor as _Auditor
    Auditor = _Auditor
    logger.info("auditor.py başarıyla yüklendi.")
except Exception:
    auditor_import_error = traceback.format_exc()
    logger.error("AUDITOR MODÜLÜ YÜKLENEMEDİ:\n%s", auditor_import_error)

# Builder (Agent 3) Entegrasyonu
Builder = None
builder_import_error: Optional[str] = None

try:
    from builder import Builder as _Builder
    Builder = _Builder
    logger.info("builder.py başarıyla yüklendi.")
except Exception:
    builder_import_error = traceback.format_exc()
    logger.error("BUILDER MODÜLÜ YÜKLENEMEDİ:\n%s", builder_import_error)

# RAG Motoru Entegrasyonu
rag_pipeline_available = False
process_and_store_document = None
init_db = None
retrieve_relevant_chunks = None

try:
    from rag_pipeline import process_and_store_document as _process, init_db as _init_db, retrieve_relevant_chunks as _retrieve
    process_and_store_document = _process
    init_db = _init_db
    retrieve_relevant_chunks = _retrieve
    rag_pipeline_available = True
    logger.info("rag_pipeline.py başarıyla yüklendi.")
except Exception:
    logger.error("RAG PIPELINE YÜKLENEMEDİ:\n%s", traceback.format_exc())


app = FastAPI(title="Project Mantis Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Sistem ayağa kalkarken Mantis'in hafıza merkezini (SQLite) hazırla."""
    logger.info("🚀 Project Mantis başlatılıyor...")
    if init_db:
        init_db()

# --- Auditor Başlatma ---
auditor = None
auditor_init_error: Optional[str] = None

if Auditor is not None:
    try:
        auditor = Auditor()
        if auditor.is_ready:
            logger.info("Auditor motoru başarıyla başlatıldı ve Qwen'e bağlandı.")
        else:
            auditor_init_error = auditor.init_error
            logger.warning("Auditor hazır değil: %s", auditor_init_error)
    except Exception:
        auditor_init_error = traceback.format_exc()
        logger.error("AUDITOR BAŞLATMA HATASI:\n%s", auditor_init_error)
else:
    auditor_init_error = auditor_import_error or "Auditor sınıfı import edilemedi."

# --- Builder Başlatma ---
builder = None
if Builder is not None:
    try:
        builder = Builder()
        logger.info("Builder motoru başarıyla başlatıldı.")
    except Exception:
        logger.error("BUILDER BAŞLATMA HATASI:\n%s", traceback.format_exc())


def get_auditor_status() -> dict:
    return {
        "import_ok": Auditor is not None,
        "initialized": auditor is not None,
        "ready": bool(auditor and auditor.is_ready),
        "import_error": auditor_import_error,
        "init_error": auditor_init_error or (auditor.init_error if auditor else None),
    }


# --- MODELLER (Pydantic şemaları) ---
class AnalyzeRequest(BaseModel):
    document_id: Optional[str] = "doc_generated"
    text: str

class RiskFindingReal(BaseModel):
    risk_id: str
    severity: str
    clause_text: str
    ai_reasoning: str
    confidence_score: int

class AnalyzeResponse(BaseModel):
    status: str
    document_id: str
    total_risks_found: int
    findings: List[RiskFindingReal]
    message: Optional[str] = None

class RedlineRequest(BaseModel):
    clause_text: str
    reasoning: str

class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None

class VaultDocument(BaseModel):
    id: str
    name: str
    access: str
    last_active: str
    type: str


# --- VERİTABANI (RAM) ---
db_vault_documents = []
db_audit_logs = [
    {
        "id": "LOG-109",
        "agent_name": "Mantis-Legal-Auditor",
        "action": "SYSTEM_READY",
        "confidence_score": 1.0,
        "source_doc_id": "SYS",
        "timestamp": "Now",
        "level": "SYS",
        "message": "Auditor, Extractor, Builder, Harness & RAG engines fully integrated.",
    }
]

# Güncellenmiş Team Members (Ahmet Usta dahil)
db_team_members = [
    { "id": 1, "name": "Sarah Jenkins", "email": "sarah.j@mantis.corp", "role": "Admin", "avatar": "SJ", "color": "from-rose-400 to-rose-600" },
    { "id": 2, "name": "Ahmet Yılmaz (Ahmet Usta)", "email": "ahmet.usta@mantis.corp", "role": "Atölye Ustası", "avatar": "AY", "color": "from-amber-400 to-amber-600" },
    { "id": 3, "name": "Hilal Uluca", "email": "hilal@mantis.corp", "role": "Lead Architect", "avatar": "HU", "color": "from-purple-400 to-purple-600" }
]


# --- ENDPOINT'LER (API Uç Noktaları) ---
@app.get("/")
def health_check():
    status = get_auditor_status()
    return {
        "status": "active" if status["ready"] else "degraded",
        "message": "Mantis Engine is running (Auditor, Builder, Harness & RAG).",
        "auditor": status,
        "extractor_available": extractor_available,
        "builder_available": builder is not None,
        "rag_available": rag_pipeline_available
    }

@app.get("/api/v1/dashboard/logs")
def get_logs():
    return db_audit_logs

@app.get("/api/v1/analysis/risks")
def get_ui_risks():
    return []

@app.get("/api/v1/team/members")
def get_team_members():
    return db_team_members

# --- YENİ: TRACK B (Offboarding Tracker) Uç Noktaları ---
@app.get("/api/v1/offboarding/tracker")
def get_offboarding_tracker():
    return {
        "employee_id": "EMP-2024-089",
        "employee": "Ahmet Yılmaz (Ahmet Usta)",
        "position": "Kıdemli Atölye Ustası",
        "hire_date": "2023-03-15",
        "absent_days": 2,
        "status": "WARNING_REQUIRED",
        "article": "İş Kanunu Madde 25/II & Madde 17",
        "assets": ["Delik Makinesi Anahtar Seti", "Kurumsal Tablet (Tab-A8)"]
    }

@app.post("/api/v1/offboarding/generate-letter")
def generate_offboarding_letter(payload: dict):
    name = payload.get("employee_name", "Ahmet Yılmaz (Ahmet Usta)")
    return {
        "status": "success",
        "message": f"{name} için İş Kanunu Madde 25/II uyarınca ihtarname taslağı başarıyla oluşturuldu.",
        "letter_content": f"İHTARNAME / RESMİ BİLDİRİM\n\nSayın {name},\n22.08.2026 ve 23.08.2026 tarihlerinde mazeretsiz olarak işe gelmediğiniz tespit edilmiştir. 4857 Sayılı İş Kanunu Madde 25/II uyarınca haklı fesih sürecimiz başlatılmıştır."
    }

@app.get("/api/v1/documents", response_model=List[VaultDocument])
def get_documents():
    return db_vault_documents

# --- YENİ: RAG Vault Doküman Yükleme Uç Noktası ---
@app.post("/api/v1/vault/upload")
async def upload_vault_document(
    file: UploadFile = File(...),
    document_type: str = Form("genel")
):
    """
    Şirket dokümanlarını (TXT ve PDF) Mantis'in SQLite vektör hafızasına (RAG) işler.
    """
    if not rag_pipeline_available or not process_and_store_document:
        raise HTTPException(status_code=503, detail="RAG Pipeline aktif değil. Sistem yöneticisiyle görüşün.")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Geçersiz dosya.")

    # 1. Format Denetimi (Artık PDF de kabul ediyoruz)
    allowed_extensions = (".txt", ".pdf")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Sadece .txt ve .pdf uzantılı dosyalar kabul edilmektedir.")

    try:
        content_bytes = await file.read()
        text_content = ""

        # 2. PDF İşleme ve Metin Çıkarma (Extraction)
        if file.filename.lower().endswith(".pdf"):
            try:
                import PyPDF2
                import io
                # Gelen byte verisini RAM üzerinde sanal bir dosyaya çevirip okutuyoruz
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
                extracted_pages = [page.extract_text() for page in pdf_reader.pages if page.extract_text()]
                text_content = "\n".join(extracted_pages)
                
                if not text_content.strip():
                    raise ValueError("Taranmış veya görsel tabanlı PDF.")
            except Exception as e:
                logger.error(f"PDF Okuma Hatası: {str(e)}")
                raise HTTPException(status_code=400, detail="PDF metni okunamadı. Dosya şifreli veya görsel (OCR gerekli) olabilir.")
        
        # 3. TXT İşleme
        elif file.filename.lower().endswith(".txt"):
            text_content = content_bytes.decode("utf-8")

        # 4. Saf metni RAG Motoruna gönder
        success = process_and_store_document(
            source_file=file.filename,
            content=text_content,
            document_type=document_type
        )

        if success:
            doc_id = "rag_" + file.filename
            db_vault_documents.insert(0, {
                "id": doc_id,
                "name": f"🗄️ {file.filename}",
                "access": "RAG Hafızasına İşlendi",
                "last_active": "Şimdi",
                "type": document_type,
            })
            
            logger.info(f"[{document_type.upper()}] RAG kaydı başarılı: {file.filename}")
            return {
                "status": "success", 
                "message": f"'{file.filename}' başarıyla Mantis RAG hafızasına işlendi.",
                "document_type": document_type
            }
        else:
            raise HTTPException(status_code=500, detail="Dosya işlenirken RAG motorunda hata oluştu.")

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="UTF-8 formatında okunamadı.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sistem hatası: {str(e)}")
# --- Eskiden Kalma Hızlı Yükleme (Extractor) Uç Noktası ---
@app.post("/api/upload")
async def upload_document_legacy(file: UploadFile = File(...)):
    if not process_document:
        raise HTTPException(status_code=500, detail="Extractor modülü yüklü değil.")
    try:
        file_bytes = await file.read()
        extraction_result = process_document(file.filename, file_bytes)
        if extraction_result.get("status") == "error":
            raise HTTPException(status_code=400, detail=extraction_result.get("message"))

        extracted_text = extraction_result.get("text", "")
        doc_id = "doc_" + file.filename

        db_vault_documents.insert(0, {
            "id": doc_id,
            "name": f"📄 {file.filename}",
            "access": "Tam Erişim (Analiz Bekliyor)",
            "last_active": "Şimdi",
            "type": "file",
        })

        return {
            "status": "success",
            "filename": file.filename,
            "document_id": doc_id,
            "extracted_text": extracted_text,
            "message": "Belge okundu, maskelendi ve Vault'a eklendi.",
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Yükleme hatası.")

@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):
    try:
        if not auditor or not auditor.is_ready:
            return {"status": "error", "reply": "Auditor motoru aktif değil. Lütfen yerel LLM bağlantısını kontrol edin."}
        
        rag_context = ""
        target_file = None
        
        # 1. Gelen ID'yi temizle (Örn: "rag_ik_politikasi.pdf" -> "ik_politikasi.pdf")
        if request.document_id:
            target_file = request.document_id.replace("rag_", "").replace("doc_", "")

        # 2. RAG Taraması: Sadece hedef belgeye odaklan
        if rag_pipeline_available and retrieve_relevant_chunks:
            relevant_docs = retrieve_relevant_chunks(request.message, top_k=2, source_file=target_file)
            
            if relevant_docs:
                rag_context = "\n[SİSTEM BİLGİSİ: İLGİLİ DOKÜMANDAN BULUNAN KAYITLAR]\n"
                for score, source, text in relevant_docs:
                    rag_context += f"- Kaynak ({source}): {text}\n"

        # 3. AI Görev Tanımını Keskinleştir (Prompt Engineering)
        if target_file:
            system_task = f"Kullanıcı şu an '{target_file}' belgesini inceliyor. Yanıtını KESİNLİKLE sağlanan [SİSTEM BİLGİSİ] içindeki metne dayandır. Cümlenin sonuna kaynağı (Örn: [Kaynak: {target_file}]) ekle."
        else:
            system_task = "Kullanıcı genel asistanla konuşuyor. Yanıtını sağlanan şirket verilerine dayandır."

        context_prompt = f"""
        Sen Project Mantis Kurumsal Asistanısın. 
        
        {rag_context}
        
        Kullanıcı Sorusu: {request.message}
        
        Görev: {system_task}
        """
        
        response_text = auditor.ask(context_prompt)
        return {"status": "success", "reply": response_text}
    except Exception as e:
        logger.error(f"Chat hatası: {str(e)}")
        return {"status": "error", "reply": "Sohbet sırasında bir hata oluştu."}

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_document(request: AnalyzeRequest):
    if not auditor or not auditor.is_ready:
        raise HTTPException(status_code=503, detail="Auditor motoru hazır değil.")
    try:
        analysis_result = auditor.analyze_text(request.text)
        raw_findings = analysis_result.get("findings", [])

        formatted_findings = []
        for idx, finding in enumerate(raw_findings):
            risk_id = finding.get("risk_id", f"R00{idx + 1}")
            formatted_findings.append(
                RiskFindingReal(
                    risk_id=risk_id,
                    severity=finding.get("severity", "High"),
                    clause_text=finding.get("clause_text", "Metin bulunamadı"),
                    ai_reasoning=finding.get("ai_reasoning", "Kural ihlali."),
                    confidence_score=int(finding.get("confidence_score", 95)),
                )
            )
            if risk_id not in db_approval_states:
                db_approval_states[risk_id] = "PENDING_APPROVAL"

        return AnalyzeResponse(
            status="success",
            document_id=request.document_id,
            total_risks_found=len(formatted_findings),
            findings=formatted_findings,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Analiz hatası oluştu.")

# Agent 3 (Builder) API Uç Noktası
@app.post("/api/redline")
def generate_redline_endpoint(request: RedlineRequest):
    if not builder:
        raise HTTPException(status_code=500, detail="Builder motoru aktif değil.")
    try:
        result = builder.generate_redline(request.clause_text, request.reasoning)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redline üretilemedi: {str(e)}")

import pandas as pd
import io
from fastapi.responses import StreamingResponse

@app.get("/api/export/csv")
def export_csv():
    data = [
        {"Risk ID": "R001", "Severity": "Critical", "Clause": "Sınırsız Sorumluluk", "Reasoning": "Şirket kurallarına aykırı"},
        {"Risk ID": "R002", "Severity": "High", "Clause": "İhbarsız Fesih", "Reasoning": "30 gün ihbar süresi olmalı"}
    ]
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=mantis_audit_report.csv"
    return response

@app.get("/api/export/excel")
def export_excel():
    data = [
        {"Risk ID": "R001", "Severity": "Critical", "Clause": "Sınırsız Sorumluluk", "Reasoning": "Şirket kurallarına aykırı"},
        {"Risk ID": "R002", "Severity": "High", "Clause": "İhbarsız Fesih", "Reasoning": "30 gün ihbar süresi olmalı"}
    ]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Risk Findings')
    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = "attachment; filename=mantis_audit_report.xlsx"
    return response

@app.post("/api/action/dispatch")
def dispatch_action_endpoint(request: ActionDispatchRequest):
    success = False
    if request.action_type.lower() == "jira":
        success = jira_adapter.dispatch_action(request.title, request.description, request.recipient)
    elif request.action_type.lower() == "email":
        success = email_adapter.dispatch_action(request.title, request.description, request.recipient)
    else:
        raise HTTPException(status_code=400, detail="Geçersiz aksiyon tipi.")

    if success:
        return {"status": "success", "message": f"Aksiyon başarıyla {request.action_type.upper()} kanalına iletildi."}
    else:
        raise HTTPException(status_code=500, detail="Aksiyon gönderilemedi.")

# --- AGENT HARNESS (İnsan Onay Mekanizması) Uç Noktaları ---
@app.post("/api/harness/approve")
def handle_harness_approval(request: ApprovalRequest):
    action_lower = request.action.lower()
    if action_lower == "approve":
        db_approval_states[request.risk_id] = "APPROVED_BY_HUMAN"
        logger.info(f"[AGENT HARNESS] Risk {request.risk_id} insan denetçi tarafından ONAYlandı.")
        return {
            "status": "success",
            "risk_id": request.risk_id,
            "approval_state": "APPROVED_BY_HUMAN",
            "message": "Bulgu onaylandı ve kilitlendi."
        }
    elif action_lower == "reject":
        db_approval_states[request.risk_id] = "REJECTED_BY_HUMAN"
        logger.info(f"[AGENT HARNESS] Risk {request.risk_id} reddedildi.")
        return {
            "status": "success",
            "risk_id": request.risk_id,
            "approval_state": "REJECTED_BY_HUMAN",
            "message": "Bulgu reddedildi."
        }
    else:
        raise HTTPException(status_code=400, detail="Geçersiz aksiyon. 'approve' veya 'reject' olmalıdır.")

@app.get("/api/harness/states")
def get_approval_states():
    return db_approval_states