import logging
import uuid
import os

logger = logging.getLogger(__name__)

class GlobalTracing:
    def __init__(self):
        self.local_region_id = os.getenv("DOCINTEL_REGION", "ap-south-1")

    def generate_global_trace_id(self) -> str:
        trace_id = f"{self.local_region_id}:{str(uuid.uuid4())}"
        logger.debug(f"[TRACING] Initialized global trace_id={trace_id}")
        return trace_id

    def log_dag_execution(self, trace_id: str, stage: str, status: str):
        logger.info(f"[GLOBAL DAG] trace={trace_id} region={self.local_region_id} stage={stage} status={status}")

global_tracing = GlobalTracing()
