import uuid
from datetime import datetime
from contextlib import contextmanager
from app.models.database import ObservabilityTrace
from sqlalchemy.orm import Session

class DistributedTracer:
    @contextmanager
    def start_span(self, trace_id: str, document_id: str, span_name: str, db: Session, attributes: dict = None):
        start = datetime.utcnow()
        trace = ObservabilityTrace(
            trace_id=trace_id,
            document_id=uuid.UUID(document_id) if isinstance(document_id, str) else document_id,
            span_name=span_name,
            start_time=start,
            attributes=attributes or {}
        )
        db.add(trace)
        db.commit()
        
        try:
            yield trace
        finally:
            end = datetime.utcnow()
            trace.end_time = end
            trace.latency_ms = (end - start).total_seconds() * 1000
            db.commit()

tracer = DistributedTracer()
