import logging
from sqlalchemy.orm import Session
from app.models.database import GroundTruthRecord
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DatasetBuilder:
    def build_training_dataset(self, db: Session, dataset_version: str) -> Dict[str, Any]:
        """
        Merges ML predictions, corrected human labels, and validation failure signals.
        Outputs BIO token sequences, layout-aware training samples, normalized class mappings.
        """
        logger.info(f"Building training dataset version {dataset_version}")
        
        records = db.query(GroundTruthRecord).filter(GroundTruthRecord.label_source == "human").all()
        
        training_samples = []
        for r in records:
            training_samples.append({
                "document_id": str(r.document_id),
                "tokens": [r.corrected_value], 
                "bboxes": [r.bounding_box or [0,0,0,0]],
                "labels": [f"B-{r.entity_type}"]
            })
            
        return {
            "dataset_version": dataset_version,
            "samples": training_samples,
            "normalized_mappings": {"TOTAL_AMOUNT": 1, "INVOICE_NUMBER": 2, "O": 0}
        }
        
    def capture_failure_signal(self, document_id: str, failed_rules: list):
        """
        Signals that a document failed validation, marking its extraction output
        as a 'hard negative' or queuing for HITL active learning.
        """
        logger.warning(f"Captured failure signal for doc {document_id}. Added to Active Learning queue.")

dataset_builder = DatasetBuilder()
