from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime

class ActionStatus(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"

class ActionType(str, Enum):
    CONTRACT_TERMINATION = "CONTRACT_TERMINATION"
    LEGAL_NOTICE_DISPATCH = "LEGAL_NOTICE_DISPATCH"
    RECORD_DELETION = "RECORD_DELETION"
    DATA_CORRECTION = "DATA_CORRECTION"
    SYSTEM_CONFIG_CHANGE = "SYSTEM_CONFIG_CHANGE"

class HarnessActionItem(BaseModel):
    id: str
    action_type: ActionType
    module: str = Field(..., description="Eylemi üreten modül: AnalysisHub, TeamHub vb.")
    summary: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="0.0 düşük risk, 1.0 kritik risk")
    requires_human_approval: bool = True
    payload: Dict[str, Any]
    status: ActionStatus = ActionStatus.PENDING_APPROVAL
    created_at: datetime = Field(default_factory=datetime.utcnow)
    decided_by: Optional[str] = None
    decision_reason: Optional[str] = None
    execution_result: Optional[Dict[str, Any]] = None

class ApprovalRequest(BaseModel):
    action_id: str
    decision: str = Field(..., regex="^(APPROVE|REJECT)$")
    decided_by: str = "Admin"
    reason: Optional[str] = None

class DispatchActionRequest(BaseModel):
    action_type: ActionType
    module: str
    summary: str
    payload: Dict[str, Any]
    risk_score: Optional[float] = 0.5