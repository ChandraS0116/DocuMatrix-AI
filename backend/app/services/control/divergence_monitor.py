from app.models.database import ShadowLogRecord
from sqlalchemy.orm import Session
import uuid
import logging

logger = logging.getLogger(__name__)

class DivergenceMonitor:
    def compute_and_log(self, document_id: str, predicted_action: str, executed_action: str, db: Session):
        divergence = predicted_action != executed_action
        severity = "medium" if divergence else "none"
        
        record = ShadowLogRecord(
            document_id=uuid.UUID(document_id),
            predicted_action=predicted_action,
            executed_action=executed_action,
            divergence_score=1.0 if divergence else 0.0,
            divergence_severity=severity
        )
        db.add(record)
        db.commit()
        
        if divergence:
            logger.warning(f"Divergence detected for {document_id}: Predicted {predicted_action}, Executed {executed_action}")
            
        return {"divergence": divergence, "severity": severity}
