from fastapi import APIRouter, HTTPException, status
from typing import List
from models.harness import (
    HarnessActionItem, 
    ApprovalRequest, 
    DispatchActionRequest
)
from services.harness_engine import harness_engine

router = APIRouter(prefix="/api/harness", tags=["Agent Harness & Guardrails"])

@router.post("/dispatch", response_model=HarnessActionItem, status_code=status.HTTP_201_CREATED)
async def dispatch_action(request: DispatchActionRequest):
    """
    Ajan veya modül tarafından bir eylem talebi açar.
    Risk analizine göre direkt işlenir veya kuyruğa alınır.
    """
    try:
        return harness_engine.register_action(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve", response_model=HarnessActionItem)
async def approve_action(request: ApprovalRequest):
    """
    Frontend'deki (AnalysisHub / TeamHub) Onayla / Reddet butonları burayı tetikler.
    """
    try:
        return harness_engine.handle_approval(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queue", response_model=List[HarnessActionItem])
async def get_approval_queue():
    """
    Bekleyen tüm insan onayı görevlerini döner.
    """
    return harness_engine.get_pending_actions()

@router.get("/status/{action_id}", response_model=HarnessActionItem)
async def get_action_status(action_id: str):
    item = harness_engine.get_action_by_id(action_id)
    if not item:
        raise HTTPException(status_code=404, detail="Eylem bulunamadı.")
    return item