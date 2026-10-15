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

try:
    import redis
except ImportError:
    redis = None
import json

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
if redis:
    redis_client = redis.from_url(REDIS_URL)
else:
    class MockRedis:
        def get(self, k): return None
        def setex(self, k, t, v): pass
        def set(self, k, v): pass
        def delete(self, *args): pass
        def keys(self, p): return []
        def incr(self, k): return 1
        def expire(self, k, t): pass
        def xadd(self, n, d): pass
    redis_client = MockRedis()

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
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.dim = 384
            logger.info("Initialized SentenceTransformer Embeddings (Fallback)")
        else:
            self.provider = "none"
            self.dim = 0
            logger.warning("No embedding provider available.")

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
