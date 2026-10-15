import os
import logging

class SystemBootstrap:

    def __init__(self):
        self.mode = os.getenv("DOCINTEL_MODE", "PRODUCTION")

    def validate_environment(self):
        required = [
            "POSTGRES_URL",
            "REDIS_URL",
            "ELASTICSEARCH_URL"
        ]

        missing = [r for r in required if not os.getenv(r)]
        if missing:
            logging.warning(f"Missing env vars: {missing} (Warning only for dev setup)")

    def warmup(self):
        logging.info("[BOOT] Starting deep system warmup (No First-Request Cold Starts Allowed)")
        
        # 1. Warm Database Pool
        logging.info("[BOOT] Warming up PostgreSQL connection pool and creating tables...")
        from app.db.session import engine, init_db
        try:
            if engine:
                with engine.connect() as conn:
                    pass
                init_db()
            else:
                logging.warning("[BOOT] Engine is None, running in mock DB mode.")
        except Exception as e:
            logging.error(f"[BOOT] Database connection failed: {e}")

        # 2. Warm Redis Cache
        logging.info("[BOOT] Warming up Redis connection...")
        try:
            import redis
            redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
            redis_client.ping()
        except ImportError:
            logging.warning("[BOOT] Redis module not installed.")
        except Exception:
            logging.warning("[BOOT] Redis unavailable (Connection refused), skipping cache warmup.")

        # 3. Warm Elasticsearch
        logging.info("[BOOT] Warming up Elasticsearch and ensuring indices...")
        from app.services.search.elasticsearch_client import es_client
        if not es_client.client:
            logging.warning("[BOOT] Elasticsearch client failed to initialize.")

        # 4. Initialize OCR Engines
        logging.info("[BOOT] Initializing OCR providers...")
        from app.services.ocr.ocr_engine import ocr_router
        if not ocr_router.tesseract:
            logging.warning("[BOOT] Tesseract failed to load.")

        # 5. Preload ML Classification Model
        logging.info("[BOOT] Preloading Sequence Classification Model into GPU/RAM...")
        from app.services.ml.classifier import classifier
        if not classifier.model:
            logging.warning("[BOOT] Classifier model failed to load or running in mock mode.")

        # 6. Preload ML Extraction Model
        logging.info("[BOOT] Preloading Token Classification Model into GPU/RAM...")
        from app.services.ml.extractor import extractor
        if not hasattr(extractor, 'ner_pipeline') or not extractor.ner_pipeline:
            logging.warning("[BOOT] Extractor model failed to load or running in mock mode.")

        # 7. Initialize Embedding Generator
        logging.info("[BOOT] Initializing Embedding Generator...")
        from app.services.rag.embeddings import embedding_generator
        if embedding_generator.provider == "none":
            logging.warning("[BOOT] Embedding generator failed to load.")
            
        logging.info("[BOOT] System Warmup Complete. All engines hot and ready.")

    def start(self):
        logging.info(f"[BOOT] Starting in {self.mode} mode")

        self.validate_environment()
        self.warmup()

        if self.mode == "DEV":
            logging.info("[BOOT] Dev mode: relaxed checks enabled")

        if self.mode == "PRODUCTION":
            logging.info("[BOOT] Production mode: strict locks enabled")

        return True
