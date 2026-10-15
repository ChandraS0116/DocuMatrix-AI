import logging
import random

logger = logging.getLogger(__name__)

class BackpressureManager:
    def __init__(self):
        self.gpu_utilization = 0.0
        self.queue_depth = 0
        self.es_latency_spike = False

    def check_health(self):
        self.gpu_utilization = random.uniform(0.6, 0.95)
        self.queue_depth = random.randint(0, 1000)
        self.es_latency_spike = random.choice([True, False])

    def enforce_limits(self, tenant_id: str, tier: str) -> dict:
        self.check_health()
        
        limits = {
            "use_gpu": True,
            "throttled": False,
            "buffer_mode": False
        }

        if self.gpu_utilization > 0.85:
            logger.warning(f"Backpressure: High GPU utilization ({self.gpu_utilization:.2f}). Downgrading CPU fallback.")
            if tier != "ENTERPRISE":
                limits["use_gpu"] = False

        if self.queue_depth > 500:
            logger.warning(f"Backpressure: High queue depth ({self.queue_depth}). Activating throttling.")
            if tier == "FREE":
                limits["throttled"] = True

        if self.es_latency_spike:
            logger.warning("Backpressure: ES Latency spike detected. Enabling write-buffer mode.")
            limits["buffer_mode"] = True

        return limits

backpressure_manager = BackpressureManager()
