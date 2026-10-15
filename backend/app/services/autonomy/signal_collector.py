from pydantic import BaseModel
from typing import Optional

class DocumentContext(BaseModel):
    document_id: str
    ocr_confidence: float = 1.0
    class_entropy: float = 0.0
    extraction_drift_detected: bool = False
    validation_error_severity: str = "NONE"
    model_health_score: float = 100.0
    ocr_failures_count: int = 0
    validation_failures_count: int = 0
    is_valid: bool = False

class SignalCollector:
    def collect(self, document_id: str, db_session=None) -> DocumentContext:
        """
        Gathers runtime intelligence across the system to form a routing context.
        """
        # Simulated context for architecture demonstration
        return DocumentContext(document_id=document_id)

signal_collector = SignalCollector()
