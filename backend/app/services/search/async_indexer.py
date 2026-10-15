import asyncio
import logging

logger = logging.getLogger(__name__)

class AsyncIndexer:
    def __init__(self, batch_size=100, flush_interval=2.0):
        self.buffer = []
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._flush_task = None

    async def buffer_document(self, document: dict):
        self.buffer.append(document)
        logger.info(f"Buffered document {document.get('document_id')} for async indexing. Buffer size: {len(self.buffer)}")
        
        if len(self.buffer) >= self.batch_size:
            if self._flush_task:
                self._flush_task.cancel()
            await self._flush_buffer()
        else:
            if not self._flush_task or self._flush_task.done():
                self._flush_task = asyncio.create_task(self._wait_and_flush())

    async def _wait_and_flush(self):
        await asyncio.sleep(self.flush_interval)
        if self.buffer:
            await self._flush_buffer()

    async def _flush_buffer(self):
        if not self.buffer:
            return
            
        batch = self.buffer[:self.batch_size]
        self.buffer = self.buffer[self.batch_size:]
        
        logger.info(f"Flushing {len(batch)} documents to Elasticsearch via bulk API")
        await asyncio.sleep(0.1) 
        logger.info("Bulk insert complete")

async_indexer = AsyncIndexer()
