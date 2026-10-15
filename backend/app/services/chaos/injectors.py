class OCRInjector:
    @staticmethod
    def generate_profile(latency_ms: int):
        return {"ocr_latency": latency_ms}

class MLModelLatencyInjector:
    @staticmethod
    def generate_profile():
        return {"gpu_overload": True}

class RedisInjector:
    @staticmethod
    def generate_profile(failure_rate: float):
        return {"redis_failure_rate": failure_rate}

class ElasticInjector:
    @staticmethod
    def generate_profile(latency_factor: float):
        return {"search_latency_factor": latency_factor}

class QueueInjector:
    @staticmethod
    def generate_profile(multiplier: float):
        return {"backpressure_multiplier": multiplier}
