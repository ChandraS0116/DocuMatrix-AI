import logging
from app.services.cost.cost_engine import cost_engine

logger = logging.getLogger(__name__)

class CostGate:
    def estimate_gpu_cpu_cost(self, estimated_units: float) -> float:
        # Simplified projection: assuming the worst-case heavy GPU usage for estimation
        return cost_engine.compute_cost("gpu_sec", estimated_units)

    def tenant_budget_remaining(self, tenant_id: str) -> float:
        # Mocking real-time budget check against Postgres/Stripe
        return 10.00  # Assuming $10 remaining for the mock

    def authorize(self, tenant_id: str, estimated_units: float) -> dict:
        projected_cost = self.estimate_gpu_cpu_cost(estimated_units)
        budget = self.tenant_budget_remaining(tenant_id)

        if projected_cost > budget:
            logger.warning(f"[COST GATE] REJECTED tenant={tenant_id}. Projected=${projected_cost:.4f} > Budget=${budget:.4f}")
            return {
                "allowed": False,
                "reason": "BUDGET_EXCEEDED",
                "action": "downgrade_to_cpu_or_reject"
            }

        logger.info(f"[COST GATE] AUTHORIZED tenant={tenant_id}. Projected=${projected_cost:.4f} <= Budget=${budget:.4f}")
        return {"allowed": True}

cost_gate = CostGate()
