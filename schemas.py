from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

# --- PYDANTIC ŞEMALARI (ANAYASA) ---

class AnalyzeRequest(BaseModel):
    document_id: str
    analysis_type: str

class RiskFinding(BaseModel):
    risk_id: str
    severity: str
    clause_text: str
    ai_reasoning: str
    confidence_score: int

class AnalyzeResponse(BaseModel):
    status: str
    document_id: str
    total_risks_found: int
    findings: List[RiskFinding]

class ApproveRequest(BaseModel):
    status: str # "approved" veya "rejected"
    user_comment: Optional[str] = None

class ExportRequest(BaseModel):
    document_id: str
    export_format: str # "csv" veya "excel"
