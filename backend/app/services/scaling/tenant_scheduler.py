import logging
from app.services.scaling.adaptive_backpressure import adaptive_backpressure_manager

logger = logging.getLogger(__name__)

class TenantScheduler:
    
    TIER_ENTERPRISE = "ENTERPRISE"
    TIER_PRO = "PRO"
    TIER_FREE = "FREE"
    
    def schedule(self, tenant_id: str, tier: str) -> dict:
        logger.info(f"Scheduling tenant {tenant_id} (Tier: {tier})")
        
        limits = adaptive_backpressure_manager.enforce_limits(tenant_id, tier)
        
        if limits["throttled"]:
            logger.warning(f"Shedding load for tenant {tenant_id}")
            return {"status": "rejected", "reason": "load_shedding"}
            
        queue_target = "queue.ml.cpu.fast"
        
        if tier == self.TIER_ENTERPRISE:
            queue_target = "queue.ml.gpu.batch"
        elif tier == self.TIER_PRO and limits["use_gpu"]:
            queue_target = "queue.ml.gpu.batch"
        elif tier == self.TIER_FREE:
            queue_target = "queue.ml.cpu.fast"
            
        logger.info(f"Routing tenant {tenant_id} to {queue_target}")
        
        return {
            "status": "accepted",
            "queue": queue_target,
            "buffer_mode": limits["buffer_mode"]
        }

tenant_scheduler = TenantScheduler()
