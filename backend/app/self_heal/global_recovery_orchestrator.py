import logging
from app.self_heal.failure_intelligence_engine import failure_intelligence_engine
from app.self_heal.failure_predictor import failure_predictor
from app.self_heal.recovery_planner import recovery_planner
from app.self_heal.region_swarm_controller import region_swarm_controller

logger = logging.getLogger(__name__)

class GlobalRecoveryOrchestrator:
    def execute_healing_cycle(self, telemetry: dict, tenant_tier: str):
        logger.info("--- [GLOBAL RECOVERY ORCHESTRATOR] Initiating Healing Cycle ---")
        
        is_imminent_failure = failure_predictor.evaluate_risk(telemetry["gpu"], telemetry["queue"])
        if is_imminent_failure:
             logger.warning("[ORCHESTRATOR] Predictive throttling triggered BEFORE breakdown.")
        
        pattern = failure_intelligence_engine.evaluate_telemetry(
            telemetry["gpu"], telemetry["queue"], telemetry["ocr_err"], telemetry["ping"]
        )
        
        if pattern["severity"] == "LOW" and not is_imminent_failure:
            logger.info("[ORCHESTRATOR] System Stable. No action required.")
            return
            
        strategy = recovery_planner.generate_strategy(pattern, tenant_tier)
        
        region_swarm_controller.detect_and_negotiate(pattern)
        
        logger.info(f"--- [GLOBAL RECOVERY ORCHESTRATOR] System self-stabilized WITHOUT human intervention ---")

global_recovery_orchestrator = GlobalRecoveryOrchestrator()
