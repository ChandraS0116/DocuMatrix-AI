from typing import Dict, Optional
import time
import logging

logger = logging.getLogger(__name__)

class ModelRegistry:
    def __init__(self):
        self.models: Dict[str, dict] = {}
        self.active_model_id: Optional[str] = None
        self.production_locked = False
        self.allowed_models = set()
        
    def register_model(self, model_id: str, is_active: bool = False, dataset_version: str = "init", metrics: dict = None):
        if self.production_locked:
            if model_id not in self.allowed_models:
                raise RuntimeError("MODEL_LOCKED_IN_PRODUCTION")
                
        self.models[model_id] = {
            "model_id": model_id,
            "health_score": 100.0,
            "last_successful_inference_time": time.time(),
            "failure_count": 0,
            "total_inferences": 0,
            "dataset_version": dataset_version,
            "metrics": metrics or {},
            "lineage": "base-layoutlmv3" if dataset_version == "init" else f"finetuned-on-{dataset_version}"
        }
        if is_active:
            self.active_model_id = model_id
            
    def set_active_model(self, model_id: str):
        if model_id in self.models:
            self.active_model_id = model_id
            
    def get_active_model_info(self) -> dict:
        if not self.active_model_id:
            return {}
        return self.models.get(self.active_model_id, {})
        
    def record_success(self, model_id: str):
        if model_id in self.models:
            self.models[model_id]["total_inferences"] += 1
            self.models[model_id]["last_successful_inference_time"] = time.time()
            
    def record_failure(self, model_id: str):
        if model_id in self.models:
            self.models[model_id]["total_inferences"] += 1
            self.models[model_id]["failure_count"] += 1
            
            failure_rate = self.models[model_id]["failure_count"] / self.models[model_id]["total_inferences"]
            self.models[model_id]["health_score"] = max(0.0, 100.0 - (failure_rate * 100))
            
            if self.models[model_id]["health_score"] < 50.0:
                self.rollback_model()
                
    def rollback_model(self):
        fallback = [m for m in self.models.values() if m["health_score"] > 80.0 and m["model_id"] != self.active_model_id]
        if fallback:
            old_model = self.active_model_id
            self.active_model_id = fallback[-1]["model_id"]
            logger.warning(f"ROLLBACK TRIGGERED: {old_model} regressed. Reverted to {self.active_model_id}")

    def lock_production_models(self, allowed_models: list):
        self.production_locked = True
        self.allowed_models = set(allowed_models)

model_registry = ModelRegistry()
model_registry.register_model("layoutlmv3-extraction-v1", is_active=True)
model_registry.register_model("layoutlmv3-classification-v1")
