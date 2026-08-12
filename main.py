from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from schemas import AnalyzeRequest, AnalyzeResponse, RiskFinding, ApproveRequest, ExportRequest
from agent import ContractAgent

# 1. FastAPI Uygulamasını Başlat
app = FastAPI(
    title="Project Mantis API",
    description="Autonomous Contract Auditing Engine - Full API Contract",
    version="1.0.0"
)

# 2. CORS Ayarları (Frontend ile haberleşme için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. AI Ajanını Başlat (Instance oluşturma)
advisor = ContractAgent()


# --- ENDPOINT'LER (KONTROLSÖZLEŞMESİ) ---

@app.get("/")
def health_check():
    return {"status": "active", "message": "Mantis Engine is running."}

@app.post("/api/upload", summary="PDF Sözleşme Yükleme")
def upload_document(file: UploadFile = File(...)):
    # Yakında: PDF'i alıp Storage'a kaydedecek ve document_id üretecek
    return {"status": "success", "filename": file.filename, "document_id": "doc_mock_123"}

@app.post("/api/analyze", response_model=AnalyzeResponse, summary="Belgeyi Analiz Et ve Riskleri Bul")
def analyze_document(request: AnalyzeRequest):
    try:
        # Gerçek ajanı çalıştırıp analizi alıyoruz
        # Not: request modelindeki metin alanının adına göre (örn: request.text veya request.content) burayı güncelleyebilirsin.
        document_text = getattr(request, "text", "Analiz edilecek metin bulunamadı.")
        
        agent_result = advisor.analyze_text(document_text)
        
        # Ajanın döndürdüğü JSON verisini response modeline dönüştürüyoruz
        findings = [
            RiskFinding(
                risk_id=item.get("risk_id", "R001"),
                severity=item.get("severity", "Medium"),
                clause_text=item.get("clause_text", ""),
                ai_reasoning=item.get("ai_reasoning", ""),
                confidence_score=item.get("confidence_score", 90)
            ) for item in agent_result.get("findings", [])
        ]

        return AnalyzeResponse(
            status="success",
            document_id=request.document_id,
            total_risks_found=len(findings),
            findings=findings
        )
    except Exception as e:
        # Hata durumunda sistemin çökmemesini, rasyonel bir şekilde hatayı dönmesini sağlıyoruz (Defensive Programming)
        return AnalyzeResponse(
            status="error",
            document_id=request.document_id,
            total_risks_found=0,
            findings=[]
        )

@app.get("/api/risks/{doc_id}", summary="Belgeye Ait Riskleri Listele")
def get_risks(doc_id: str):
    return {"document_id": doc_id, "risks": []}

@app.post("/api/approve/{risk_id}", summary="Risk Maddesini Onayla veya Reddet")
def approve_risk(risk_id: str, request: ApproveRequest):
    return {"status": "success", "risk_id": risk_id, "action": request.status}

@app.get("/api/adapters", summary="Aktif Entegrasyon Adaptörlerini Listele (Jira, Excel vb.)")
def get_adapters():
    return {"active_adapters": ["Jira", "Excel", "Email"]}

@app.post("/api/export", summary="Onaylanan Verileri Dışarı Aktar (CSV/Excel/Jira)")
def export_data(request: ExportRequest):
    return {"status": "success", "format": request.export_format, "download_url": "/downloads/report.xlsx"}