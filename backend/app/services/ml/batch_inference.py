import asyncio
import logging

logger = logging.getLogger(__name__)

class BatchInferenceEngine:
    def __init__(self, model, batch_size=16, max_wait_ms=50):
        self.queues = {
            "ENTERPRISE": [],
            "PRO": [],
            "FREE": []
        }
        self.model = model
        self.batch_size = batch_size
        self.max_wait_ms = max_wait_ms
        self._flush_task = None

    async def submit(self, payload, tier: str = "FREE"):
        if tier not in self.queues:
            tier = "FREE"
            
        future = asyncio.Future()
        self.queues[tier].append((payload, future))

        if len(self.queues[tier]) >= self.batch_size:
            if self._flush_task:
                self._flush_task.cancel()
            await self._flush_tier(tier)
        else:
            if not self._flush_task or self._flush_task.done():
                self._flush_task = asyncio.create_task(self._wait_and_flush())

        return await future

    async def _wait_and_flush(self):
        await asyncio.sleep(self.max_wait_ms / 1000.0)
        
        for tier in ["ENTERPRISE", "PRO", "FREE"]:
            while self.queues[tier]:
                await self._flush_tier(tier)

    async def _flush_tier(self, tier: str):
        if not self.queues[tier]:
            return
            
        batch = self.queues[tier][:self.batch_size]
        self.queues[tier] = self.queues[tier][self.batch_size:]

        payloads = [item[0] for item in batch]
        futures = [item[1] for item in batch]
        
        try:
            results = self.model(payloads)
            
            for i, future in enumerate(futures):
                if not future.done():
                    future.set_result(results[i] if i < len(results) else None)
        except Exception as e:
            logger.error(f"Batch inference flush failed for tier {tier}: {e}")
            for future in futures:
                if not future.done():
                    future.set_exception(e)
