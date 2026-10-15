try:
    from celery import Celery
except ImportError:
    Celery = None

if Celery:
    celery = Celery(
        "doc_pipeline",
        broker="redis://redis:6379/0",
        backend="redis://redis:6379/1"
    )
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
