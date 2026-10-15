from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import ObservabilityTrace, Document, TenantSlaMetric
from datetime import datetime, timedelta

class SLAEngine:
    def generate_tenant_health(self, tenant_id: str, db: Session):
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        total_docs = db.query(Document).filter(Document.tenant_id == tenant_id, Document.uploaded_at >= yesterday).count()
        success_docs = db.query(Document).filter(Document.tenant_id == tenant_id, Document.status == "INDEXED", Document.uploaded_at >= yesterday).count()
        success_rate = (success_docs / total_docs) if total_docs > 0 else 1.0
        
        traces = db.query(ObservabilityTrace.latency_ms).join(Document, ObservabilityTrace.document_id == Document.id).filter(
            Document.tenant_id == tenant_id, ObservabilityTrace.end_time >= yesterday
        ).limit(100).all()
        
        latencies = [t[0] for t in traces if t[0] is not None]
        latencies.sort()
        p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
        
        health_score = (success_rate * 100.0) - (p95_latency / 1000.0)
        
        metric = TenantSlaMetric(
            tenant_id=tenant_id,
            p95_latency_ms=p95_latency,
            success_rate=success_rate,
            hitl_rate=0.0,
            health_score=max(0.0, min(100.0, health_score))
        )
        db.add(metric)
        db.commit()
        return metric

sla_engine = SLAEngine()
