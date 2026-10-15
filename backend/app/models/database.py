from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Numeric,
    ForeignKey,
    Integer,
    BigInteger,
    Float,
    JSON
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    mime_type = Column(String(100))
    file_size_bytes = Column(BigInteger)
    sha256_hash = Column(String(64))
    page_count = Column(Integer)
    status = Column(String(50), default='UPLOADED')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")
    ocr_results = relationship("OcrResult", back_populates="document", cascade="all, delete-orphan")
    classifications = relationship("Classification", back_populates="document", cascade="all, delete-orphan")
    extracted_data = relationship("ExtractedData", back_populates="document", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResultRecord", back_populates="document", cascade="all, delete-orphan")
    business_actions = relationship("BusinessAction", back_populates="document", cascade="all, delete-orphan")

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    transition_state = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    actor = Column(String(100))
    metadata_json = Column(JSONB)
    
    document = relationship("Document", back_populates="audit_logs")

class OcrResult(Base):
    __tablename__ = 'ocr_results'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    ocr_engine_version = Column(String(100), nullable=False)
    processing_duration_ms = Column(Integer)
    page_count = Column(Integer)
    raw_response = Column(JSONB, nullable=False)
    canonical_document = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    document = relationship("Document", back_populates="ocr_results")

class Classification(Base):
    __tablename__ = 'classifications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    predicted_class = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    class_probabilities = Column(JSONB)
    classifier_version = Column(String(100), nullable=False)
    inference_latency_ms = Column(Float)
    fallback_used = Column(Boolean, default=False)
    classification_explanation = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    document = relationship("Document", back_populates="classifications")

class GroundTruthLabel(Base):
    __tablename__ = 'ground_truth_labels'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    predicted_class = Column(String(100))
    actual_class = Column(String(100), nullable=False)
    reviewed_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class GroundTruthRecord(Base):
    __tablename__ = 'ground_truth_records'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    entity_type = Column(String(100), nullable=False)
    predicted_value = Column(String)
    corrected_value = Column(String, nullable=False)
    bounding_box = Column(JSONB)
    label_source = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class ExtractedData(Base):
    __tablename__ = 'extracted_data'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    schema_type = Column(String(100), nullable=False)
    structured_json = Column(JSONB, nullable=False)
    extractor_version = Column(String(100), nullable=False)
    extraction_model_version = Column(String(100))
    fallback_used = Column(Boolean, default=False)
    token_label_distribution = Column(JSONB)
    entity_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    document = relationship("Document", back_populates="extracted_data")

class ValidationResultRecord(Base):
    __tablename__ = 'validation_results'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    is_valid = Column(Boolean, nullable=False)
    rule_results = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    document = relationship("Document", back_populates="validation_results")

class PipelineDecision(Base):
    __tablename__ = 'pipeline_decisions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    stage = Column(String(100), nullable=False)
    decision = Column(JSON, nullable=False)
    reason = Column(String(512), nullable=False)
    model_version = Column(String(100))
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class ExecutionGraphRecord(Base):
    __tablename__ = 'execution_graphs'
    
    graph_id = Column(String(100), primary_key=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    graph_json = Column(JSON, nullable=False)
    current_state = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class ExecutionNodeRecord(Base):
    __tablename__ = 'execution_nodes'
    
    node_id = Column(String(100), primary_key=True)
    graph_id = Column(String(100), ForeignKey('execution_graphs.graph_id'), nullable=False)
    action = Column(String(100), nullable=False)
    status = Column(String(100), nullable=False)
    input_snapshot = Column(JSON, nullable=True)
    output_snapshot = Column(JSON, nullable=True)
    error_log = Column(String, nullable=True)

class PolicyExperienceRecord(Base):
    __tablename__ = 'policy_experiences'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    graph_id = Column(String(100), ForeignKey('execution_graphs.graph_id'), nullable=False)
    decision_path = Column(JSON, nullable=False)
    reward_score = Column(Float, nullable=False)
    context_features = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class PolicyVersionRecord(Base):
    __tablename__ = 'policy_versions'
    
    version_id = Column(String(100), primary_key=True)
    model_weights = Column(JSON, nullable=False)
    performance_metrics = Column(JSON, nullable=False)
    rollout_status = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class TrajectoryRecord(Base):
    __tablename__ = 'trajectories'
    
    trajectory_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    graph_id = Column(String(100), ForeignKey('execution_graphs.graph_id'), nullable=False)
    state = Column(JSON, nullable=False)
    action = Column(String(100), nullable=False)
    next_state = Column(JSON, nullable=False)
    reward = Column(Float, nullable=False)
    done = Column(Boolean, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class ShadowLogRecord(Base):
    __tablename__ = 'shadow_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    predicted_action = Column(String(100), nullable=False)
    executed_action = Column(String(100), nullable=False)
    reward_estimate = Column(Float, nullable=True)
    divergence_score = Column(Float, nullable=True)
    divergence_severity = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class ObservabilityTrace(Base):
    __tablename__ = 'observability_traces'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trace_id = Column(String(100), index=True, nullable=False)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    span_name = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), default=datetime.utcnow)
    end_time = Column(DateTime(timezone=True), nullable=True)
    latency_ms = Column(Float, nullable=True)
    attributes = Column(JSONB, nullable=True)

class EventStreamLog(Base):
    __tablename__ = 'event_stream_logs'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class TenantSlaMetric(Base):
    __tablename__ = 'tenant_sla_metrics'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), index=True, nullable=False)
    metric_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    p95_latency_ms = Column(Float, nullable=True)
    success_rate = Column(Float, nullable=True)
    hitl_rate = Column(Float, nullable=True)
    health_score = Column(Float, nullable=True)

class CostMeteringLog(Base):
    __tablename__ = 'cost_metering_logs'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), index=True, nullable=False)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    resource_type = Column(String(50), nullable=False)
    consumption = Column(Float, nullable=False)
    cost_usd = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class TenantSubscription(Base):
    __tablename__ = 'tenant_subscriptions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), index=True, nullable=False, unique=True)
    plan_type = Column(String(50), nullable=False, default="FREE")
    status = Column(String(50), nullable=False, default="ACTIVE")
    billing_cycle_start = Column(DateTime(timezone=True), default=datetime.utcnow)
    billing_cycle_end = Column(DateTime(timezone=True), nullable=True)

class ApiKey(Base):
    __tablename__ = 'api_keys'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_hash = Column(String(255), unique=True, index=True, nullable=False)
    tenant_id = Column(String(50), index=True, nullable=False)
    scopes = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked = Column(Boolean, default=False, nullable=False)

class BillingUsageEvent(Base):
    __tablename__ = 'billing_usage_events'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)
    units_consumed = Column(Float, nullable=False)
    cost_usd = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    trace_id = Column(String(100), nullable=True)

class ExecutionChainRecord(Base):
    __tablename__ = 'execution_chain'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    node_name = Column(String(100), nullable=False)
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class ExecutionNodeRuntimeRecord(Base):
    __tablename__ = 'execution_node_runtimes'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    node_id = Column(String(100), nullable=False)
    retry_count = Column(Integer, default=0)
    max_retries_allowed = Column(Integer, default=3)
    execution_attempts = Column(JSONB, default=list)
    fallback_invocations = Column(Integer, default=0)
    chaos_context_applied = Column(Boolean, default=False)
    loop_signature_hash = Column(String(64), nullable=True)
    execution_cycle_id = Column(UUID(as_uuid=True), default=uuid.uuid4)
    execution_cycle_index = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class RetryEventLog(Base):
    __tablename__ = 'retry_event_logs'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(String(100), index=True, nullable=False)
    attempt_number = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    chaos_active = Column(Boolean, default=False)

class Tenant(Base):
    __tablename__ = 'tenants'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    api_key_hash = Column(String(255), nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = 'subscriptions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), ForeignKey('tenants.tenant_id'), unique=True, nullable=False)
    stripe_subscription_id = Column(String(255), nullable=True)
    plan_tier = Column(String(50), nullable=False, default="Starter")
    status = Column(String(50), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class TenantUsageMetric(Base):
    __tablename__ = 'tenant_usage_metrics'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), index=True, nullable=False)
    billing_cycle = Column(String(50), nullable=False)
    ocr_pages_used = Column(Integer, default=0)
    gpu_seconds_used = Column(Float, default=0.0)
    embedding_calls_used = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class BillingEvent(Base):
    __tablename__ = 'billing_events'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), index=True, nullable=False)
    idempotency_key = Column(String(255), unique=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    units = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

class StripeWebhookEvent(Base):
    __tablename__ = 'stripe_webhook_events'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_event_id = Column(String(255), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class BusinessAction(Base):
    __tablename__ = 'business_actions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(100), nullable=False, default="default", index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    status = Column(String(50), nullable=False)
    risk_level = Column(String(50), nullable=False)
    recommended_action = Column(String(255), nullable=False)
    reasoning = Column(String(1024), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    document = relationship("Document", back_populates="business_actions")
