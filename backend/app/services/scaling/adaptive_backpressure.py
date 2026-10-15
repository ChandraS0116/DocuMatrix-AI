import logging
import random
import numpy as np
from collections import deque

logger = logging.getLogger(__name__)

class AdaptiveBackpressureManager:
    def __init__(self, window_size=100):
        self.window_size = window_size
        self.gpu_history = deque(maxlen=window_size)
        self.queue_history = deque(maxlen=window_size)
        self.es_latency_spike = False
        
        self.gpu_history.extend([0.6] * 10)
        self.queue_history.extend([50] * 10)

    def _update_metrics(self):
        self.gpu_history.append(random.uniform(0.5, 1.0))
        self.queue_history.append(random.randint(0, 1200))
        self.es_latency_spike = random.choice([True, False])

    def compute_gpu_threshold(self):
        return np.percentile(self.gpu_history, 90)

    def compute_queue_threshold(self, tenant_class):
        if tenant_class == "ENTERPRISE":
            return np.percentile(self.queue_history, 95)
        return np.percentile(self.queue_history, 75)

    def enforce_limits(self, tenant_id: str, tier: str) -> dict:
        self._update_metrics()
        
        current_gpu = self.gpu_history[-1]
        current_queue = self.queue_history[-1]
        
        gpu_threshold = self.compute_gpu_threshold()
        queue_threshold = self.compute_queue_threshold(tier)
        
        limits = {
            "use_gpu": True,
            "throttled": False,
            "buffer_mode": False
        }

        if current_gpu > gpu_threshold:
            logger.warning(f"Adaptive Backpressure: GPU ({current_gpu:.2f}) exceeded p90 threshold ({gpu_threshold:.2f}). Downgrading CPU fallback.")
            if tier != "ENTERPRISE":
                limits["use_gpu"] = False

        if current_queue > queue_threshold:
            logger.warning(f"Adaptive Backpressure: Queue depth ({current_queue}) exceeded dynamic threshold ({queue_threshold:.0f}) for {tier}. Activating throttling.")
            if tier == "FREE":
                limits["throttled"] = True

        if self.es_latency_spike:
            logger.warning("Adaptive Backpressure: ES Latency spike detected. Enabling write-buffer mode.")
            limits["buffer_mode"] = True

        return limits

adaptive_backpressure_manager = AdaptiveBackpressureManager()
