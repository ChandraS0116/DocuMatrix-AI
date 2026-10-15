import logging
import uuid
import hashlib
import json

logger = logging.getLogger(__name__)

class DAGReplayEngine:
    def __init__(self):
        self.repair_chain = []

    def _hash_payload(self, payload: dict) -> str:
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    def reconstruct_and_repair(self, original_dag_id: str, failed_node_id: str, new_output: dict):
        logger.info(f"[REPLAY ENGINE] Surgically repairing DAG {original_dag_id} at node {failed_node_id}")
        
        repaired_hash = self._hash_payload(new_output)
        
        repair_event = {
            "repair_id": str(uuid.uuid4()),
            "original_dag_id": original_dag_id,
            "failed_node_id": failed_node_id,
            "correction_reason": "NODE_FAILURE_RECOVERY",
            "repaired_output_hash": repaired_hash
        }
        
        self.repair_chain.append(repair_event)
        logger.info(f"[REPLAY ENGINE] REPAIR CHAIN UPDATED: Appended deterministic overlay for {original_dag_id}.")
        return repair_event

dag_replay_engine = DAGReplayEngine()
