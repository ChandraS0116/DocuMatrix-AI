import logging
from app.services.cutover.deployment_mode import DeploymentMode

logger = logging.getLogger(__name__)

class RollbackGate:
    def __init__(self):
        self.error_rate_threshold = 0.05
        self.divergence_safe_limit = 10.0

    def evaluate(self, metrics):
        if metrics.get("is_shadow"):
            return

        error_rate = metrics.get("error_rate", 0.0)
        divergence_score = metrics.get("divergence_score", 0.0)

        if error_rate > self.error_rate_threshold:
            self.trigger_immediate_rollback()

        if divergence_score > self.divergence_safe_limit:
            self.freeze_deployment()

    def trigger_immediate_rollback(self):
        logger.error("ROLLBACK GATE TRIGGERED: Restoring stable pipeline!")
        DeploymentMode.set_mode(DeploymentMode.DISABLED)
        
    def freeze_deployment(self):
        logger.warning("DEPLOYMENT FROZEN: Divergence limits breached.")
        
rollback_gate = RollbackGate()
