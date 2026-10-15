from app.services.autonomy.execution_graph import ExecutionGraph, GraphNode, NodeStatus
from app.services.autonomy.pipeline_controller import PipelineAction
from app.services.autonomy.policy_optimizer import policy_optimizer
from app.services.autonomy.signal_collector import DocumentContext
from app.services.autonomy.rl.state_encoder import state_encoder
from app.services.autonomy.rl.reward_normalizer import reward_normalizer
from app.models.database import ExecutionGraphRecord, ExecutionNodeRecord, TrajectoryRecord
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class ExecutionEngine:
    def __init__(self, executor_callback):
        self.execute = executor_callback

    def run(self, graph: ExecutionGraph, context: DocumentContext, db: Session):
        graph_record = db.query(ExecutionGraphRecord).filter(ExecutionGraphRecord.graph_id == graph.graph_id).first()
        if not graph_record:
            graph_record = ExecutionGraphRecord(
                graph_id=graph.graph_id,
                document_id=graph.document_id,
                graph_json=graph.model_dump(),
                current_state="RUNNING"
            )
            db.add(graph_record)
            
            for node_id, node in graph.nodes.items():
                node_record = ExecutionNodeRecord(
                    node_id=node.node_id, graph_id=graph.graph_id, action=node.action.value,
                    status=node.status.value, input_snapshot=node.inputs
                )
                db.add(node_record)
            db.commit()

        while not graph.is_complete():
            node = graph.get_next_ready_node()
            if not node:
                running_nodes = [n for n in graph.nodes.values() if graph.state[n.node_id].status == NodeStatus.RUNNING]
                if not running_nodes:
                    graph_record.current_state = "FAILED_STUCK"
                    db.commit()
                    break
                break

            self._mark_node_running(graph, node, db)
            
            try:
                logger.info(f"ExecutionEngine: Executing node {node.name} ({node.action.value})")
                
                result = self.execute(node.action, node.inputs, graph.document_id, db)
                
                self._mark_node_complete(graph, node, result, db)
            except Exception as e:
                logger.error(f"ExecutionEngine: Node execution failed: {e}")
                self._handle_node_failure(graph, node, str(e), db)
                
        graph_record.current_state = "COMPLETED" if all(s.status == NodeStatus.COMPLETED for s in graph.state.values()) else "FAILED"
        graph_record.graph_json = graph.model_dump()
        db.commit()
        
        raw_reward = policy_optimizer.evaluate(graph)
        norm_reward = reward_normalizer.normalize(raw_reward)
        
        # Record Policy Experience
        decision_path = [node.action.value for node in graph.nodes.values()]
        policy_optimizer.record_experience(graph, context.model_dump(), decision_path, db)
        
        # Record RL Trajectory
        final_state = state_encoder.encode(context)
        traj = TrajectoryRecord(
            document_id=graph.document_id,
            graph_id=graph.graph_id,
            state=final_state,
            action=decision_path[0] if decision_path else "UNKNOWN",
            next_state=final_state,
            reward=norm_reward,
            done=True
        )
        db.add(traj)
        db.commit()

    def _mark_node_running(self, graph: ExecutionGraph, node: GraphNode, db: Session):
        node.status = NodeStatus.RUNNING
        graph.state[node.node_id].status = NodeStatus.RUNNING
        record = db.query(ExecutionNodeRecord).filter(ExecutionNodeRecord.node_id == node.node_id).first()
        if record:
            record.status = NodeStatus.RUNNING.value
        db.commit()
        
    def _mark_node_complete(self, graph: ExecutionGraph, node: GraphNode, result: dict, db: Session):
        graph.mark_complete(node, result)
        record = db.query(ExecutionNodeRecord).filter(ExecutionNodeRecord.node_id == node.node_id).first()
        if record:
            record.status = NodeStatus.COMPLETED.value
            record.output_snapshot = node.outputs
        db.commit()
        
    def _handle_node_failure(self, graph: ExecutionGraph, node: GraphNode, error_msg: str, db: Session):
        node.retry_count += 1
        graph.state[node.node_id].retries = node.retry_count
        node.error_log = error_msg
        
        if node.retry_count <= node.max_retries:
            node.status = NodeStatus.PENDING
            graph.state[node.node_id].status = NodeStatus.PENDING
            new_status = NodeStatus.PENDING.value
            logger.warning(f"ExecutionEngine: Retrying node {node.name} ({node.retry_count}/{node.max_retries})")
        else:
            graph.mark_failed(node)
            new_status = NodeStatus.FAILED.value
            logger.error(f"ExecutionEngine: Node {node.name} failed permanently after {node.retry_count} attempts.")
            
        record = db.query(ExecutionNodeRecord).filter(ExecutionNodeRecord.node_id == node.node_id).first()
        if record:
            record.status = new_status
            record.error_log = error_msg
        db.commit()
