import uuid
from typing import Dict, List, Optional
from models.harness import (
    HarnessActionItem, 
    ActionStatus, 
    ActionType, 
    ApprovalRequest,
    DispatchActionRequest
)

class AgentHarnessEngine:
    """
    Project Mantis - Otonom Ajan Denetleme ve Güvenlik (Harness) Motoru.
    Ajanların ürettiği kritik eylemleri durdurur, risk skorlar ve insan onayına sunar.
    """
    def __init__(self):
        # Gerçek ortamda Redis / PostgreSQL kuyruğuyla eşleşebilir
        self._action_store: Dict[str, HarnessActionItem] = {}

    def register_action(self, req: DispatchActionRequest) -> HarnessActionItem:
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        
        # Risk analizi ve Guardrail kuralları
        # Risk skoru > 0.4 ise veya kritik tiplerse zorunlu onay
        critical_types = {
            ActionType.RECORD_DELETION, 
            ActionType.LEGAL_NOTICE_DISPATCH, 
            ActionType.CONTRACT_TERMINATION
        }
        requires_approval = (req.risk_score or 0.0) >= 0.4 or req.action_type in critical_types

        action_item = HarnessActionItem(
            id=action_id,
            action_type=req.action_type,
            module=req.module,
            summary=req.summary,
            risk_score=req.risk_score or 0.5,
            requires_human_approval=requires_approval,
            payload=req.payload,
            status=ActionStatus.PENDING_APPROVAL if requires_approval else ActionStatus.APPROVED
        )

        self._action_store[action_id] = action_item

        # Eğer insan onayı gerektirmiyorsa direkt execute et
        if not requires_approval:
            self._execute_action(action_item)

        return action_item

    def handle_approval(self, req: ApprovalRequest) -> HarnessActionItem:
        action_item = self._action_store.get(req.action_id)
        if not action_item:
            raise ValueError(f"Eylem bulunamadı: {req.action_id}")

        action_item.decided_by = req.decided_by
        action_item.decision_reason = req.reason

        if req.decision == "APPROVE":
            action_item.status = ActionStatus.APPROVED
            self._execute_action(action_item)
        else:
            action_item.status = ActionStatus.REJECTED

        return action_item

    def _execute_action(self, action: HarnessActionItem):
        """
        Onaylanan eylemin gerçek sistem entegrasyonu (Dispatch mantığı).
        """
        try:
            # Buraya alt modül çağrıları (Email gönderimi, DB silme, PDF üretimi vb.) bağlanır
            action.execution_result = {
                "success": True,
                "message": f"Eylem ({action.action_type}) başarıyla yürütüldü.",
                "details": action.payload
            }
            action.status = ActionStatus.EXECUTED
        except Exception as e:
            action.status = ActionStatus.FAILED
            action.execution_result = {"success": False, "error": str(e)}

    def get_pending_actions(self) -> List[HarnessActionItem]:
        return [
            item for item in self._action_store.values() 
            if item.status == ActionStatus.PENDING_APPROVAL
        ]

    def get_action_by_id(self, action_id: str) -> Optional[HarnessActionItem]:
        return self._action_store.get(action_id)

# Singleton Instance
harness_engine = AgentHarnessEngine()