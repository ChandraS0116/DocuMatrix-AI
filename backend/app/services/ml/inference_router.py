from app.services.billing.quota_enforcer import quota_enforcer
from app.models.database import SessionLocal

class InferenceRouter:
    def route(self, task_metadata: dict, system_load: dict, tenant_id: str) -> str:
        db = SessionLocal()
        try:
            quota_check = quota_enforcer.check_quota(tenant_id, "ML_INFERENCE_GPU", 1.0, db)
            gpu_util = system_load.get("gpu_utilization", 0.0)
            latency_sensitive = task_metadata.get("latency_sensitive", False)
            
            if not quota_check.get("allowed", False) and quota_check.get("downgrade_to_cpu", False):
                return "CPU_LIGHTWEIGHT_MODEL" # Soft downgrade due to quota
                
            if gpu_util > 0.7:
                return "CPU_LIGHTWEIGHT_MODEL"
                
            if latency_sensitive:
                return "CPU_LIGHTWEIGHT_MODEL"
                
            return "GPU_BATCH_MODEL"
        finally:
            db.close()

inference_router = InferenceRouter()
