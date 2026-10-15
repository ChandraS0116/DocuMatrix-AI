from typing import Optional, Dict, Any, List
import logging
from sqlalchemy.orm import Session
from app.models.database import GroundTruthRecord
import uuid

logger = logging.getLogger(__name__)

class GroundTruthCollector:
    def log_if_available(self, document_id: str, extraction_result: Any, db: Session):
        """
        Hook called after extraction.
        In a real system, this checks if auto-verify thresholds met to log implicit ground truth.
        """
        pass
        
    def capture_correction(self, document_id: str, tenant_id: str, corrections: List[Dict[str, Any]], user_id: str, db: Session):
        """
        Capture OPERATOR corrections from HITL UI (Phase 1E).
        """
        for corr in corrections:
            record = GroundTruthRecord(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                document_id=uuid.UUID(document_id),
                entity_type=corr.get("entity_type"),
                predicted_value=corr.get("predicted_value"),
                corrected_value=corr.get("corrected_value"),
                bounding_box=corr.get("bounding_box"),
                label_source="human",
            )
            db.add(record)
        db.commit()
        logger.info(f"Captured {len(corrections)} human corrections for doc {document_id}")

    def capture_validation_failure(self, document_id: str, tenant_id: str, failed_rules: list, db: Session):
        """
        Capture validation overrides (Phase 1D).
        Converts validation failure signals into negative examples.
        """
        for rule in failed_rules:
            for field in rule.get("affected_fields", []):
                # Tag as requiring review / bad prediction
                record = GroundTruthRecord(
                    id=uuid.uuid4(),
                    tenant_id=tenant_id,
                    document_id=uuid.UUID(document_id),
                    entity_type=field,
                    predicted_value="UNKNOWN", # Needs human review to get corrected
                    corrected_value="PENDING_REVIEW",
                    label_source="validation_failure"
                )
                db.add(record)
        db.commit()

ground_truth_collector = GroundTruthCollector()
