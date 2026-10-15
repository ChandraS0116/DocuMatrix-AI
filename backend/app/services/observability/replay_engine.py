from sqlalchemy.orm import Session
from app.models.database import ExecutionGraphRecord, TrajectoryRecord, ShadowLogRecord, EventStreamLog

class ReplayEngine:
    def rebuild_execution(self, document_id: str, db: Session):
        events = db.query(EventStreamLog).filter(EventStreamLog.document_id == document_id).order_by(EventStreamLog.timestamp).all()
        graph = db.query(ExecutionGraphRecord).filter(ExecutionGraphRecord.document_id == document_id).first()
        trajectory = db.query(TrajectoryRecord).filter(TrajectoryRecord.document_id == document_id).first()
        shadow_log = db.query(ShadowLogRecord).filter(ShadowLogRecord.document_id == document_id).first()
        
        return {
            "document_id": str(document_id),
            "timeline": [{"event": e.event_type, "time": e.timestamp.isoformat(), "payload": e.payload} for e in events],
            "dag_graph": graph.graph_json if graph else None,
            "rl_trajectory": {
                "state": trajectory.state,
                "action": trajectory.action,
                "reward": trajectory.reward
            } if trajectory else None,
            "shadow_log": {
                "predicted": shadow_log.predicted_action,
                "executed": shadow_log.executed_action,
                "diverged": shadow_log.divergence_score > 0
            } if shadow_log else None
        }

replay_engine = ReplayEngine()
