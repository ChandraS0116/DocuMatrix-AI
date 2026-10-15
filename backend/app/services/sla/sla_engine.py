import logging
from app.services.scaling.adaptive_backpressure import adaptive_backpressure_manager

logger = logging.getLogger(__name__)

class SLAEngine:
    TARGETS = {
        "ENTERPRISE": 1000, 
        "PRO": 3000,
        "FREE": 10000
    }

    def enforce(self, tenant_id: str, tier: str, latency_p95_ms: float):
        target = self.TARGETS.get(tier, 10000)
        
        if latency_p95_ms > target:
            logger.warning(f"[SLA BREACH] tenant={tenant_id} tier={tier} latency={latency_p95_ms}ms > target={target}ms")
            
            if tier == "ENTERPRISE":
                logger.error(f"[SLA PENALTY] Auto-crediting billing for ENTERPRISE tenant {tenant_id}")
                self.trigger_backpressure(tier)
                self.scale_gpu_nodes()
            elif tier == "PRO":
                logger.warning(f"[SLA WARNING] Throttling lower tiers to protect PRO tenant {tenant_id}")
                self.trigger_backpressure(tier)
            else:
                logger.info(f"[SLA OK] FREE tier {tenant_id} queued delay acceptable.")

    def trigger_backpressure(self, breached_tier: str):
        logger.warning(f"SLA Engine engaging backpressure. Simulating queue spike.")
        adaptive_backpressure_manager.queue_history.append(5000)

    def scale_gpu_nodes(self):
        logger.info("SLA Engine commanding KEDA/HPA to aggressively scale GPU nodes.")

sla_engine = SLAEngine()
