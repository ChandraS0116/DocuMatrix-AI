import logging
from typing import Any

logger = logging.getLogger(__name__)

class QueueFederation:
    def mirror_task(self, target_region: str, queue_name: str, payload: Any, idempotency_key: str):
        logger.info(f"[FEDERATION] Mirroring task {idempotency_key} to {target_region} queue {queue_name}")

    def replay_failed_region(self, dead_region: str, target_region: str):
        logger.warning(f"[FEDERATION] Replaying unfinished DAGs from {dead_region} into {target_region}")

queue_federation = QueueFederation()
