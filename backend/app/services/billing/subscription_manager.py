from app.models.database import TenantSubscription
from sqlalchemy.orm import Session

class SubscriptionManager:
    PLAN_QUOTAS = {
        "FREE": {
            "max_documents_per_day": 100,
            "max_gpu_minutes": 0,
            "max_embedding_calls": 1000,
            "max_rag_queries": 50
        },
        "PRO": {
            "max_documents_per_day": 10000,
            "max_gpu_minutes": 300,
            "max_embedding_calls": 50000,
            "max_rag_queries": 5000
        },
        "ENTERPRISE": {
            "max_documents_per_day": 1000000,
            "max_gpu_minutes": 10000,
            "max_embedding_calls": 5000000,
            "max_rag_queries": 500000
        }
    }
    
    def get_tenant_plan(self, tenant_id: str, db: Session) -> dict:
        sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
        plan_type = sub.plan_type if sub else "FREE"
        return {
            "plan_type": plan_type,
            "quotas": self.PLAN_QUOTAS.get(plan_type, self.PLAN_QUOTAS["FREE"])
        }

subscription_manager = SubscriptionManager()
