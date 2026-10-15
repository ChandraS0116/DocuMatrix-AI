from app.services.autonomy.signal_collector import DocumentContext

class StateEncoder:
    def encode(self, context: DocumentContext) -> dict:
        return {
            "ocr_confidence": max(0.0, min(1.0, context.ocr_confidence)),
            "class_entropy": max(0.0, min(1.0, context.class_entropy)),
            "extraction_drift": 1.0 if context.extraction_drift_detected else 0.0,
            "validation_risk": 1.0 if context.validation_error_severity == "HIGH" else (0.5 if context.validation_error_severity == "MEDIUM" else 0.0),
            "model_health": max(0.0, min(1.0, context.model_health_score / 100.0)),
            "document_type": hash(context.document_type) % 100 / 100.0 if context.document_type else 0.0,
            "tenant_tier": 1.0 if context.tenant_id == "PRODUCTION_CRITICAL" else 0.5,
            "state_schema_version": "v1.0"
        }

state_encoder = StateEncoder()
