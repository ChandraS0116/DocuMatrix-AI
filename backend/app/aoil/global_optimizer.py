import logging
from app.aoil.reward_engine import reward_engine
from app.aoil.tradeoff_controller import tradeoff_controller
from app.aoil.model_optimizer import model_optimizer
from app.aoil.routing_optimizer import routing_optimizer

logger = logging.getLogger(__name__)

class GlobalOptimizer:
    def generate_optimal_snapshot(self, execution_traces: list, telemetry: dict) -> dict:
        logger.info("🧠 [AOIL] Compiling new global optimization snapshot.")
        
        for trace in execution_traces:
            reward_engine.compute_reward(trace, trace.get("tier", "FREE"))
            
        model_policy = model_optimizer.compute_model_policy(telemetry.get("accuracy", {}))
        routing_policy = routing_optimizer.compute_routing_policy(telemetry.get("cost", {}))
        
        proposed_snapshot = {
            "models": model_policy,
            "routing": routing_policy,
            "ENTERPRISE": {"use_cpu_fallback": False},
            "FREE": {"gpu_priority": 0, "batch_size": 32}
        }
        
        if not tradeoff_controller.validate_policy_safety(proposed_snapshot):
            logger.critical("🚨 [AOIL] Proposed snapshot failed safety checks. Aborting update.")
            return None
            
        logger.info("✅ [AOIL] New optimized policy snapshot approved.")
        return proposed_snapshot

global_optimizer = GlobalOptimizer()
