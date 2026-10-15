import logging

logger = logging.getLogger(__name__)

class RecoveryPlanner:
    def generate_strategy(self, failure_pattern: dict, tenant_tier: str) -> dict:
        logger.info(f"[PLANNER] Generating recovery strategy for pattern={failure_pattern['pattern']} tier={tenant_tier}")
        
        strategy = {
            "reroute_region": False,
            "downgrade_model": False,
            "replay_dag": False,
            "split_batch": False
        }
        
        if failure_pattern["pattern"] == "REGION_DEGRADATION":
            strategy["reroute_region"] = True
            strategy["replay_dag"] = True
        elif failure_pattern["pattern"] == "CASCADING_SATURATION":
            if tenant_tier != "ENTERPRISE":
                strategy["downgrade_model"] = True
            else:
                strategy["split_batch"] = True
                
        logger.info(f"[PLANNER] Generated strategy: {strategy}")
        return strategy

recovery_planner = RecoveryPlanner()
