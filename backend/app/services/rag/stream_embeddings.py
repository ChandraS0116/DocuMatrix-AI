import asyncio
import logging
import hashlib

logger = logging.getLogger(__name__)

class StreamEmbeddings:
    def __init__(self):
        self.chunk_size = 256
        
    async def process_stream(self, text: str) -> list:
        chunks = [text[i:i+self.chunk_size] for i in range(0, len(text), self.chunk_size)]
        if not chunks:
            chunks = ["empty"]
            
        embeddings = []
        for idx, chunk in enumerate(chunks):
            cache_key = hashlib.sha256(chunk.encode()).hexdigest()
            logger.info(f"Streaming embedding chunk {idx+1}/{len(chunks)} (cache key: {cache_key})")
            
            await asyncio.sleep(0.01)
            embeddings.append([0.1, 0.2, 0.3])
            
        return embeddings

stream_embeddings = StreamEmbeddings()
