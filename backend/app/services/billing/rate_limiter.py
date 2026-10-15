try:
    import redis
except ImportError:
    redis = None
import os
from fastapi import HTTPException

if redis:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
else:
    class MockRedis:
        def incr(self, k): return 1
        def expire(self, k, t): pass
    redis_client = MockRedis()

class RateLimiter:
    def check_rate_limit(self, tenant_id: str, endpoint: str, limit: int, window_seconds: int):
        key = f"rate_limit:{tenant_id}:{endpoint}"
        
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, window_seconds)
            
        if current > limit:
            raise HTTPException(status_code=429, detail="Rate Limit Exceeded")
            
        return True

rate_limiter = RateLimiter()
