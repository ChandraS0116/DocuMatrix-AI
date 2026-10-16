import os
from fastapi import HTTPException
from app.services.common.redis_client import get_safe_redis

redis_client = get_safe_redis()

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
