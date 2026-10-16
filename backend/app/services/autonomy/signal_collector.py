from pydantic import BaseModel
from typing import Optional

class DocumentContext(BaseModel):
    document_id: str
    tenant_id: str = "default"
    document_type: str = "generic"
    ocr_confidence: float = 1.0
    class_entropy: float = 0.0
    extraction_drift_detected: bool = False
    validation_error_severity: str = "NONE"
    model_health_score: float = 100.0
    ocr_failures_count: int = 0
    validation_failures_count: int = 0
    is_valid: bool = True

class SignalCollector:
    def collect(self, document_id: str, db_session=None) -> DocumentContext:
        """
        Gathers runtime intelligence across the system to form a routing context.
        """
        tenant_id = "default"
        doc_type = "generic"
        if db_session:
            try:
                from app.models.database import Document, Classification
                doc = db_session.query(Document).filter(Document.id == document_id).first()
                if doc:
                    tenant_id = doc.tenant_id
                cl = db_session.query(Classification).filter(Classification.document_id == document_id).first()
                if cl and cl.predicted_class:
                    doc_type = cl.predicted_class
            except Exception:
                pass

        return DocumentContext(
            document_id=document_id,
            tenant_id=tenant_id,
            document_type=doc_type
        )

signal_collector = SignalCollector()
