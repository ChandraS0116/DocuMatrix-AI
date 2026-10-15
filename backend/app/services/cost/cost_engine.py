import logging
from typing import Dict

logger = logging.getLogger(__name__)

class CostTracker:
    GPU_COST_PER_SEC = 0.002
    CPU_COST_PER_SEC = 0.0002
    EMBEDDING_COST = 0.00001
    OCR_PAGE_COST = 0.0005

    def __init__(self):
        self.tenant_ledgers: Dict[str, float] = {}

    def compute_cost(self, operation: str, units: float) -> float:
        if operation == "gpu_sec":
            return units * self.GPU_COST_PER_SEC
        elif operation == "cpu_sec":
            return units * self.CPU_COST_PER_SEC
        elif operation == "embedding_chunk":
            return units * self.EMBEDDING_COST
        elif operation == "ocr_page":
            return units * self.OCR_PAGE_COST
        return 0.0

    def record(self, tenant_id: str, operation: str, units: float):
        cost = self.compute_cost(operation, units)
        self.tenant_ledgers[tenant_id] = self.tenant_ledgers.get(tenant_id, 0.0) + cost
        self.persist_to_billing_table(tenant_id, cost)
        logger.info(f"[COST] tenant={tenant_id} operation={operation} units={units} cost=${cost:.6f}")

    def persist_to_billing_table(self, tenant_id: str, cost: float):
        pass

cost_engine = CostTracker()
