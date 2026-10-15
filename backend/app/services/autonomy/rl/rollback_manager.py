from sqlalchemy.orm import Session
from app.models.database import PolicyVersionRecord
import logging

logger = logging.getLogger(__name__)

class RollbackManager:
    def check_and_rollback(self, db: Session) -> bool:
        active_policy = db.query(PolicyVersionRecord).filter(PolicyVersionRecord.rollout_status == "ACTIVE").first()
        if not active_policy:
            return False
            
        metrics = active_policy.performance_metrics
        if metrics.get("recent_reward_avg", 0.0) < -2.0:
            logger.critical("Rollback condition triggered: Reward Collapse!")
            active_policy.rollout_status = "ROLLBACK"
            
            stable_policy = db.query(PolicyVersionRecord).filter(PolicyVersionRecord.rollout_status == "STABLE").order_by(PolicyVersionRecord.created_at.desc()).first()
            if stable_policy:
                stable_policy.rollout_status = "ACTIVE"
            db.commit()
            return True
            
        return False

rollback_manager = RollbackManager()
