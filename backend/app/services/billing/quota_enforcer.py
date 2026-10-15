from fastapi import HTTPException
from app.services.billing.subscription_manager import subscription_manager
from app.models.database import BillingUsageEvent
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

class QuotaEnforcer:
    def check_quota(self, tenant_id: str, resource_type: str, required_units: float, db: Session):
        plan_info = subscription_manager.get_tenant_plan(tenant_id, db)
        quotas = plan_info["quotas"]
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        current_usage = db.query(func.sum(BillingUsageEvent.units_consumed)).filter(
            BillingUsageEvent.tenant_id == tenant_id,
            BillingUsageEvent.event_type == resource_type,
            BillingUsageEvent.timestamp >= thirty_days_ago
        ).scalar() or 0.0
        
        limit_key_map = {
            "OCR": "max_documents_per_day",
            "ML_INFERENCE_GPU": "max_gpu_minutes",
            "EMBEDDING": "max_embedding_calls",
            "RAG_QUERY": "max_rag_queries"
        }
        
        limit_key = limit_key_map.get(resource_type)
        limit = quotas.get(limit_key, 0)
        
        if current_usage + required_units > limit:
            if resource_type == "ML_INFERENCE_GPU":
                return {"allowed": False, "downgrade_to_cpu": True}
            raise HTTPException(status_code=429, detail=f"QUOTA_EXCEEDED: Exceeded limit for {resource_type}")
            
        return {"allowed": True}

quota_enforcer = QuotaEnforcer()
