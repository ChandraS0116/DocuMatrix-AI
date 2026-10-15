import logging

logger = logging.getLogger(__name__)

class RewardEngine:
    def compute_reward(self, execution_trace: dict, tier: str) -> float:
        gpu_cost = execution_trace.get("gpu_cost", 0)
        latency = execution_trace.get("latency", 0)
        accuracy = execution_trace.get("accuracy", 1.0)
        sla_met = execution_trace.get("sla_met", True)
        
        weights = self._get_tier_weights(tier)
        
        reward = (
            (accuracy * weights["accuracy"]) 
            - (gpu_cost * weights["cost_penalty"])
            - (latency * weights["latency_penalty"])
            + (100 if sla_met else -500)
        )
        
        logger.debug(f"[AOIL: REWARD] Evaluated trace for {tier}. Reward: {reward:.2f}")
        return reward

    def _get_tier_weights(self, tier: str) -> dict:
        if tier == "ENTERPRISE":
            return {"accuracy": 500, "cost_penalty": 0.1, "latency_penalty": 0.2}
        elif tier == "PRO":
            return {"accuracy": 300, "cost_penalty": 0.5, "latency_penalty": 0.5}
        else: # FREE
            return {"accuracy": 100, "cost_penalty": 2.0, "latency_penalty": 0.1}

reward_engine = RewardEngine()
