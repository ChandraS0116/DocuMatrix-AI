import os

try:
    from celery import Celery
except ImportError:
    Celery = None

REDIS_URL = os.getenv("REDIS_URL") or os.getenv("CELERY_BROKER_URL") or "redis://localhost:6379/0"
REDIS_BACKEND = os.getenv("CELERY_RESULT_BACKEND") or (REDIS_URL.rstrip("/0") + "/1")

if Celery:
    celery = Celery(
        "doc_pipeline",
        broker=REDIS_URL,
        backend=REDIS_BACKEND
    )
    celery.conf.broker_connection_retry_on_startup = False
    celery.conf.broker_connection_max_retries = 2
    celery.conf.broker_connection_timeout = 2.0
else:
    class MockCelery:
        class conf:
            task_routes = {}
            worker_prefetch_multiplier = 1
            task_acks_late = True
        def task(self, *args, **kwargs):
            def decorator(func):
                func.delay = lambda *a, **k: None
                return func
            return decorator
    celery = MockCelery()

celery.conf.task_routes = {
    "app.services.processing.tasks.ocr_*": {"queue": "queue.ml.cpu"},
    "app.services.processing.tasks.classify_*": {"queue": "queue.ml.gpu.batch"},
    "app.services.processing.tasks.embed_*": {"queue": "queue.embedding.stream"},
    "app.services.processing.tasks.index_*": {"queue": "queue.indexer.bulk"},
    "app.services.processing.tasks.process_document_task": {"queue": "queue.ml.cpu"},
    "app.services.processing.tasks.index_document_task": {"queue": "queue.indexer.bulk"},
}

celery.conf.worker_prefetch_multiplier = 1
celery.conf.task_acks_late = True
