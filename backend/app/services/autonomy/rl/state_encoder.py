from app.services.autonomy.signal_collector import DocumentContext

class StateEncoder:
    def encode(self, context: DocumentContext) -> dict:
        ocr_conf = getattr(context, "ocr_confidence", 1.0)
        class_entropy = getattr(context, "class_entropy", 0.0)
        drift = getattr(context, "extraction_drift_detected", False)
        val_sev = getattr(context, "validation_error_severity", "NONE")
        model_health = getattr(context, "model_health_score", 100.0)
        doc_type = getattr(context, "document_type", "generic")
        tenant_id = getattr(context, "tenant_id", "default")

        return {
            "ocr_confidence": max(0.0, min(1.0, ocr_conf)),
            "class_entropy": max(0.0, min(1.0, class_entropy)),
            "extraction_drift": 1.0 if drift else 0.0,
            "validation_risk": 1.0 if val_sev == "HIGH" else (0.5 if val_sev == "MEDIUM" else 0.0),
            "model_health": max(0.0, min(1.0, model_health / 100.0)),
            "document_type": hash(doc_type) % 100 / 100.0 if doc_type else 0.0,
            "tenant_tier": 1.0 if tenant_id == "PRODUCTION_CRITICAL" else 0.5,
            "state_schema_version": "v1.0"
        }

state_encoder = StateEncoder()
