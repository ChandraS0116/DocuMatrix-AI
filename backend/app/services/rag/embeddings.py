import os
import hashlib
import logging

try:
    import openai
except ImportError:
    openai = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

import json
from app.services.common.redis_client import get_safe_redis

logger = logging.getLogger(__name__)

redis_client = get_safe_redis()

class EmbeddingGenerator:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        if self.openai_key and openai:
            openai.api_key = self.openai_key
            self.provider = "openai"
            self.dim = 3072
            logger.info("Initialized OpenAI Embeddings (Primary)")
        elif SentenceTransformer:
            self.provider = "local"
            self._model = None
            self.dim = 384
            logger.info("SentenceTransformer Embeddings configured (Lazy Loaded)")
        else:
            self.provider = "none"
            self.dim = 0
            logger.warning("No embedding provider available.")

    @property
    def model(self):
        if self._model is None and SentenceTransformer:
            try:
                self._model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model: {e}")
        return self._model

    def generate(self, text: str, tenant_id: str = "default") -> dict:
        text_hash = hashlib.sha256(f"{tenant_id}:{text}".encode()).hexdigest()
        cache_key = f"emb_cache:{text_hash}"
        
        cached = redis_client.get(cache_key)
        if cached:
            vector = json.loads(cached)
            return {"vector": vector, "dim": len(vector), "provider": "cache", "cache_key": cache_key}

        if self.provider == "openai":
            try:
                response = openai.Embedding.create(
                    input=text,
                    model="text-embedding-3-large"
                )
                vector = response['data'][0]['embedding']
                redis_client.setex(cache_key, 86400 * 30, json.dumps(vector))
                return {"vector": vector, "dim": self.dim, "provider": self.provider, "cache_key": cache_key}
            except Exception as e:
                logger.error(f"OpenAI embedding failed: {e}")
                return {"vector": [], "dim": 0, "provider": "failed", "error": str(e)}
                
        elif self.provider == "local":
            try:
                vector = self.model.encode(text).tolist()
                redis_client.setex(cache_key, 86400 * 30, json.dumps(vector))
                return {"vector": vector, "dim": self.dim, "provider": self.provider, "cache_key": cache_key}
            except Exception as e:
                logger.error(f"Local embedding failed: {e}")
                return {"vector": [], "dim": 0, "provider": "failed", "error": str(e)}
        else:
            return {"vector": [], "dim": 0, "provider": "none"}

embedding_generator = EmbeddingGenerator()
