from sqlalchemy.orm import Session
from app.models.database import TrajectoryRecord, PolicyVersionRecord
import logging
import random
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class OfflineTrainer:
    def __init__(self):
        self.q_network = {}
        self.target_network = {}
        self.gamma = 0.95
        self.alpha = 0.1
        self.batch_size = 64
        
    @property
    def model_weights(self):
        return self.q_network
        
    def train(self, db: Session):
        logger.info("Starting Offline Policy Training (Batch Q-Learning)")
        
        trajectories = db.query(TrajectoryRecord).order_by(TrajectoryRecord.timestamp.desc()).limit(1000).all()
        if len(trajectories) < self.batch_size:
            logger.info("Not enough experiences for batch update.")
            return
            
        minibatch = random.sample(trajectories, self.batch_size)
        
        for t in minibatch:
            s_key = self._hash_state(t.state)
            ns_key = self._hash_state(t.next_state)
            action = t.action
            reward = t.reward
            
            if s_key not in self.q_network:
                self.q_network[s_key] = {}
            if ns_key not in self.target_network:
                self.target_network[ns_key] = {}
                
            max_next_q = 0.0
            if not t.done and self.target_network[ns_key]:
                max_next_q = max(self.target_network[ns_key].values())
                
            target = reward + self.gamma * max_next_q
            
            old_val = self.q_network[s_key].get(action, 0.0)
            self.q_network[s_key][action] = old_val + self.alpha * (target - old_val)
            
        self._soft_update_target_network()
        
        active_policy = db.query(PolicyVersionRecord).filter(PolicyVersionRecord.rollout_status == "ACTIVE").first()
        if active_policy:
            active_policy.rollout_status = "STABLE"
            
        new_version = PolicyVersionRecord(
            version_id=str(uuid.uuid4()),
            model_weights=self.q_network,
            performance_metrics={"training_samples": len(minibatch)},
            rollout_status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(new_version)
        db.commit()
        logger.info(f"Deployed new ACTIVE policy version {new_version.version_id}")
        
    def _soft_update_target_network(self, tau=0.01):
        for s_key, actions in self.q_network.items():
            if s_key not in self.target_network:
                self.target_network[s_key] = {}
            for a, q_val in actions.items():
                target_val = self.target_network[s_key].get(a, 0.0)
                self.target_network[s_key][a] = target_val + tau * (q_val - target_val)

    def _hash_state(self, state: dict) -> str:
        ocr = "HIGH" if state.get("ocr_confidence", 0.0) > 0.6 else "LOW"
        risk = "HIGH" if state.get("validation_risk", 0.0) > 0.5 else "LOW"
        return f"{ocr}_{risk}"

    def _discretize_context(self, context_dict: dict) -> str:
        return self._hash_state(context_dict)

offline_trainer = OfflineTrainer()
