import logging
from app.services.ml.batch_inference import BatchInferenceEngine
from app.services.ml.warm_pool import warm_pool
from app.services.rag.stream_embeddings import stream_embeddings
from app.services.search.async_indexer import async_indexer

logger = logging.getLogger(__name__)

class AsyncExecutor:
    def __init__(self):
        self.ocr_engine = BatchInferenceEngine(warm_pool.get("ocr"), batch_size=8, max_wait_ms=100)
        self.class_engine = BatchInferenceEngine(warm_pool.get("distilbert"), batch_size=16, max_wait_ms=50)
        self.ext_engine = BatchInferenceEngine(warm_pool.get("layoutlmv3"), batch_size=4, max_wait_ms=150)

    async def execute_pipeline(self, document_id: str, tenant_id: str, payload_bytes: bytes, tier: str = "FREE"):
        logger.info(f"[{document_id}] Starting async pipeline execution for tier {tier}")
        
        ocr_res = await self.ocr_engine.submit(payload_bytes, tier=tier)
        text = ocr_res if isinstance(ocr_res, str) else "extracted text"
        
        class_res = await self.class_engine.submit(text, tier=tier)
        
        ext_res = await self.ext_engine.submit(payload_bytes, tier=tier)
        
        embeddings = await stream_embeddings.process_stream(text)
        
        await async_indexer.buffer_document({
            "document_id": document_id,
            "tenant_id": tenant_id,
            "text": text,
            "embeddings": embeddings,
            "class": class_res
        })
        
        logger.info(f"[{document_id}] Async pipeline completed successfully")
        return {"status": "success"}

async_executor = AsyncExecutor()
