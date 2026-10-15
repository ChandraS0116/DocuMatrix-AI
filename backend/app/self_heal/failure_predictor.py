import logging
from collections import deque

logger = logging.getLogger(__name__)

class FailurePredictor:
    def __init__(self):
        self.gpu_window = deque(maxlen=10)
        self.queue_window = deque(maxlen=10)

    def evaluate_risk(self, current_gpu: float, current_queue: int) -> bool:
        self.gpu_window.append(current_gpu)
        self.queue_window.append(current_queue)
        
        if len(self.gpu_window) >= 3:
            slope = self.gpu_window[-1] - self.gpu_window[-3]
            if slope > 0.2 and current_gpu > 0.8:
                logger.critical(f"🔮 [PREDICTOR] GPU Saturation predicted within 2 minutes. Slope: +{slope:.2f}")
                return True
                
        if len(self.queue_window) >= 3:
            q_slope = self.queue_window[-1] - self.queue_window[-3]
            if q_slope > 500 and current_queue > 1000:
                logger.critical(f"🔮 [PREDICTOR] Queue explosion predicted. Slope: +{q_slope}/tick")
                return True
                
        return False

failure_predictor = FailurePredictor()
