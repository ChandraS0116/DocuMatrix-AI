import json
import uuid
from datetime import datetime
from app.models.database import EventStreamLog
from sqlalchemy.orm import Session
try:
    import redis
except ImportError:
    redis = None
import os

if redis:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
else:
    class MockRedis:
        def xadd(self, n, d): pass
    redis_client = MockRedis()

class EventStream:
    def publish(self, event_type: str, document_id: str, payload: dict, db: Session):
        log = EventStreamLog(
            document_id=uuid.UUID(document_id) if isinstance(document_id, str) else document_id,
            event_type=event_type,
            payload=payload,
            timestamp=datetime.utcnow()
        )
        db.add(log)
        db.commit()
        
        stream_name = "docintel_event_stream"
        event_data = {
            "document_id": str(document_id),
            "event_type": event_type,
            "payload": json.dumps(payload),
            "timestamp": log.timestamp.isoformat()
        }
        redis_client.xadd(stream_name, event_data)

event_stream = EventStream()
