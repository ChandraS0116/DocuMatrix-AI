import logging

logger = logging.getLogger(__name__)

class ModelOptimizer:
    def compute_model_policy(self, historical_accuracy: dict) -> dict:
        logger.info("[AOIL: MODEL] Computing model assignment policy.")
        
        policy = {
            "ENTERPRISE": "LayoutLMv3",
            "PRO": "lightweight-transformer" if historical_accuracy.get("PRO", 1.0) > 0.95 else "LayoutLMv3",
            "FREE": "tesseract-cpu-only"
        }
        
        logger.info(f"[AOIL: MODEL] Optimized Policy: {policy}")
        return policy

model_optimizer = ModelOptimizer()
