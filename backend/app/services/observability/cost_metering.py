from app.models.database import CostMeteringLog
from sqlalchemy.orm import Session
import uuid

class CostMetering:
    GPU_COST_PER_SEC = 0.0005
    CPU_COST_PER_SEC = 0.0001
    
    def log_inference(self, tenant_id: str, document_id: str, resource_type: str, seconds: float, db: Session):
        cost_usd = seconds * (self.GPU_COST_PER_SEC if resource_type == "GPU" else self.CPU_COST_PER_SEC)
        
        log = CostMeteringLog(
            tenant_id=tenant_id,
            document_id=uuid.UUID(document_id) if isinstance(document_id, str) else document_id,
            resource_type=f"{resource_type}_SECONDS",
            consumption=seconds,
            cost_usd=cost_usd
        )
        db.add(log)
        db.commit()
        return log

cost_metering = CostMetering()
