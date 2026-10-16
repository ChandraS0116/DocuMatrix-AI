import os
import logging

logger = logging.getLogger(__name__)

try:
    import redis
except ImportError:
    redis = None

class SafeRedis:
    """
    Bulletproof Redis client wrapper.
    Attempts real Redis operations with short timeouts.
    If Redis is down or unreachable, transparently falls back to safe non-blocking mock behaviors.
    """
    def __init__(self, url: str = None):
        self.url = url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client = None
        if redis and self.url:
            try:
                self._client = redis.from_url(
                    self.url,
                    socket_connect_timeout=0.2,
                    socket_timeout=0.2,
                    retry_on_timeout=False
                )
            except Exception as e:
                logger.warning(f"Failed to create Redis client for {self.url}: {e}")
                self._client = None

    def __getattr__(self, name):
        def method(*args, **kwargs):
            if self._client:
                try:
                    return getattr(self._client, name)(*args, **kwargs)
                except Exception:
                    # Connection refused or timeout: degrade gracefully
                    pass
            # Sensible defaults for mock fallback
            if name in ["get"]: return None
            if name in ["incr"]: return 1
            if name in ["setnx"]: return True
            if name in ["keys"]: return []
            return None
        return method

def get_safe_redis(url: str = None) -> SafeRedis:
    return SafeRedis(url)
