from app.services.autonomy.execution_graph import ExecutionGraph, NodeStatus
from app.services.autonomy.pipeline_controller import PipelineAction
from app.models.database import PolicyExperienceRecord
import uuid

class PolicyOptimizer:
    def evaluate(self, graph: ExecutionGraph) -> float:
        total_nodes = len(graph.nodes)
        if total_nodes == 0:
            return 0.0
            
        success_nodes = sum(1 for state in graph.state.values() if state.status == NodeStatus.COMPLETED)
        
        latency_penalty = 1.0 * total_nodes 
        retry_cost = sum(state.retries for state in graph.state.values())
        hitl_triggered = any(n.action == PipelineAction.SEND_TO_HITL_PRIORITY for n in graph.nodes.values())
        
        failed_validations = 0
        for node in graph.nodes.values():
            if node.action == PipelineAction.PROCEED_TO_VALIDATION and node.status == NodeStatus.COMPLETED:
                if node.outputs.get("is_valid", False) is False:
                    failed_validations += 1
                    
        success_rate = success_nodes / total_nodes
        hitl_rate = 1.0 if hitl_triggered else 0.0
        validation_accuracy = 1.0 if failed_validations == 0 else 0.0
        
        reward = (
            (2.0 * success_rate) -
            (1.5 * latency_penalty) -
            (2.0 * retry_cost) -
            (3.0 * hitl_rate) +
            (1.0 * validation_accuracy)
        )
        return reward
        
    def record_experience(self, graph: ExecutionGraph, context_features: dict, decision_path: list, db):
        reward_score = self.evaluate(graph)
        record = PolicyExperienceRecord(
            document_id=uuid.UUID(graph.document_id),
            graph_id=graph.graph_id,
            decision_path=decision_path,
            reward_score=reward_score,
            context_features=context_features
        )
        db.add(record)
        db.commit()

policy_optimizer = PolicyOptimizer()
