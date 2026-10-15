import logging

logger = logging.getLogger(__name__)

def dummy_load(name):
    return lambda batch: [f"{name}_result" for _ in batch]

class ModelWarmPool:
    def __init__(self):
        self.pool = {}

    def preload(self):
        logger.info("Initializing ModelWarmPool. Preloading all execution engines.")
        self.pool["layoutlmv3"] = dummy_load("layoutlmv3")
        self.pool["distilbert"] = dummy_load("distilbert")
        self.pool["ocr"] = dummy_load("ocr")
        logger.info("Model preload complete. Zero cold-start ready.")

    def get(self, name: str):
        if name not in self.pool:
            logger.warning(f"Model {name} not found in WarmPool. Initiating panic load.")
            self.pool[name] = dummy_load(name)
        return self.pool[name]

warm_pool = ModelWarmPool()
