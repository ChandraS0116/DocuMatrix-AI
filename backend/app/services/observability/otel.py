import logging
import uuid
from typing import Dict, Any

logger = logging.getLogger(__name__)

class OTelTracer:
    def __init__(self):
        pass

    def start_trace(self) -> str:
        return str(uuid.uuid4())

    def record_metrics(self, trace_id: str, tags: Dict[str, Any]):
        log_str = " | ".join(f"{k}={v}" for k, v in tags.items())
        logger.info(f"[OTEL] trace_id={trace_id} | {log_str}")

otel_tracer = OTelTracer()
