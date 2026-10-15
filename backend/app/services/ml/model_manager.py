import os
import logging
from typing import Any

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.models = {}
        self.device = os.getenv("MODEL_DEVICE", "cpu")

    def load_model(self, name: str, loader_fn: callable) -> Any:
        if name not in self.models:
            logger.info(f"Lazy loading model: {name}")
            try:
                self.models[name] = loader_fn(self.device)
            except Exception as e:
                logger.error(f"Failed to load model {name}: {e}")
                raise e
        return self.models[name]

    def warmup(self, warmup_configs: list):
        for name, loader_fn, warmup_fn in warmup_configs:
            try:
                model = self.load_model(name, loader_fn)
                if warmup_fn:
                    logger.info(f"Warming up model: {name}")
                    warmup_fn(model)
            except Exception as e:
                logger.error(f"Warmup failed for {name}: {e}")

    def reload(self, name: str, loader_fn: callable):
        logger.info(f"Reloading model: {name}")
        self.models[name] = loader_fn(self.device)

model_registry = ModelManager()
