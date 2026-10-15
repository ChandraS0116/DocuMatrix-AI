import time
import logging
from celery import shared_task
from app.db.session import SessionLocal

from app.services.pipeline.async_bridge import AsyncBridge
from app.services.pipeline.async_executor import async_executor

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_document_task(self, document_id: str, tenant_id: str, payload_path: str = None):
    db = SessionLocal()
    try:
        logger.info(f"Starting async batched pipeline for {document_id}")
        
        image_bytes = b"dummy_image_data" 
        
        t0 = time.time()
        
        # In a real system, tier would be fetched from tenant config. Mocking "PRO" here.
        tier = "PRO"
        
        coro = async_executor.execute_pipeline(document_id, tenant_id, image_bytes, tier=tier)
        result = AsyncBridge.run(coro)
        
        latency_ms = int((time.time() - t0) * 1000)
        logger.info(f"OBSERVABILITY: ASYNC_PIPELINE | Latency: {latency_ms}ms")
        
        db.commit()
        
        logger.info(f"Pipeline completed successfully for {document_id}")
        return {"status": "SUCCESS", "document_id": document_id}
        
    except Exception as exc:
        db.rollback()
        logger.error(f"Pipeline failed for {document_id}: {exc}. Pushing to DLQ.")
        logger.error(f"DLQ_LOG: document_id={document_id}, tenant_id={tenant_id}, error={str(exc)}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()
