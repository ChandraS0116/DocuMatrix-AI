import asyncio
import logging

logger = logging.getLogger(__name__)

class AsyncBridge:
    @staticmethod
    def run(coro):
        """
        Executes an asynchronous coroutine in a dedicated, isolated event loop.
        Ensures strict worker determinism and prevents event loop leakage.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        except Exception as e:
            logger.error(f"AsyncBridge execution failed: {e}")
            raise
        finally:
            loop.close()
            asyncio.set_event_loop(None)
