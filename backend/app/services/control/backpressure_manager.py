class BackpressureManager:
    def evaluate(self, queue_metrics: dict) -> str:
        depth = queue_metrics.get("depth", 0)
        latency_spike_detected = queue_metrics.get("latency_spike_detected", False)
        
        if depth > 10000:
            return "THROTTLE_LOW_PRIORITY_TENANTS"
            
        if latency_spike_detected:
            return "ENABLE_PRIORITY_SHEDDING"
            
        return "NORMAL"

backpressure_manager = BackpressureManager()
