from app.services.billing.quota_enforcer import quota_enforcer
from app.models.database import SessionLocal

class OCRRouter:
    def route(self, document_metadata: dict, tenant_id: str) -> str:
        db = SessionLocal()
        try:
            # Enforce OCR quota before routing
            quota_enforcer.check_quota(tenant_id, "OCR", 1.0, db)
            
            quality_score = document_metadata.get("quality_score", 1.0)
            is_scanned_image = document_metadata.get("is_scanned_image", False)
            
            if quality_score < 0.4:
                return "queue.ocr.high_accuracy"
                
            if is_scanned_image:
                return "queue.ocr.image_enhanced"
                
            return "queue.ocr.standard"
        finally:
            db.close()

ocr_router = OCRRouter()
