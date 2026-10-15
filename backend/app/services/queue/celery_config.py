from kombu import Queue

CELERY_QUEUES = (
    Queue('queue.default', routing_key='task.default'),
    Queue('queue.ocr.low', routing_key='task.ocr.low'),
    Queue('queue.ocr.high', routing_key='task.ocr.high'),
    Queue('queue.ml.cpu', routing_key='task.ml.cpu'),
    Queue('queue.ml.gpu', routing_key='task.ml.gpu'),
    Queue('queue.validation', routing_key='task.validation'),
    Queue('queue.indexing', routing_key='task.indexing'),
    Queue('queue.rag.embedding', routing_key='task.rag.embedding'),
    Queue('queue.ml.shadow', routing_key='task.ml.shadow'),
    Queue('queue.ocr.shadow', routing_key='task.ocr.shadow'),
    Queue('queue.rag.shadow', routing_key='task.rag.shadow'),
    Queue('queue.indexing.shadow', routing_key='task.indexing.shadow'),
    Queue('queue.ml.gpu.batch', routing_key='task.ml.gpu.batch'),
    Queue('queue.ml.cpu.fast', routing_key='task.ml.cpu.fast'),
    Queue('queue.embedding.stream', routing_key='task.embedding.stream'),
    Queue('queue.indexer.bulk', routing_key='task.indexer.bulk'),
)

class TenantQueueRouter:
    def route(self, task_type: str, tenant_tier: str, priority: str = "NORMAL"):
        if task_type == "OCR":
            return "queue.ocr.high" if priority == "HIGH" else "queue.ocr.low"
            
        if task_type == "ML_INFERENCE":
            return "queue.ml.gpu" if tenant_tier == "ENTERPRISE" else "queue.ml.cpu"
            
        if task_type == "INDEXING":
            return "queue.indexing"
            
        if task_type == "EMBEDDING":
            return "queue.rag.embedding"
            
        if task_type == "VALIDATION":
            return "queue.validation"

        return "queue.default"

tenant_queue_router = TenantQueueRouter()
