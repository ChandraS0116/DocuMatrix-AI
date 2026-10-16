from app.services.autonomy.signal_collector import DocumentContext
from app.models.database import PipelineDecision
from sqlalchemy.orm import Session
import uuid
import logging
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class PipelineAction(str, Enum):
    OCR_REPROCESS_ENHANCED = "OCR_REPROCESS_ENHANCED"
    PROCEED_TO_CLASSIFICATION = "PROCEED_TO_CLASSIFICATION"
    CLASSIFY_USING_ML_STRONG_MODEL = "CLASSIFY_USING_ML_STRONG_MODEL"
    PROCEED_TO_EXTRACTION = "PROCEED_TO_EXTRACTION"
    SWITCH_TO_FALLBACK_EXTRACTION = "SWITCH_TO_FALLBACK_EXTRACTION"
    PROCEED_TO_VALIDATION = "PROCEED_TO_VALIDATION"
    SEND_TO_HITL_PRIORITY = "SEND_TO_HITL_PRIORITY"
    PROCEED_TO_INDEXING = "PROCEED_TO_INDEXING"
    HOLD_FOR_REVIEW = "HOLD_FOR_REVIEW"
    TERMINATE = "TERMINATE"
    UNKNOWN = "UNKNOWN"

from app.services.autonomy.rl.state_encoder import state_encoder
from app.services.autonomy.rl.policy_shield import policy_shield

class Provenance(dict):
    def __init__(self, signal_snapshot_id: str = "current", model_version: str = "policy_v1", **kwargs):
        super().__init__(signal_snapshot_id=signal_snapshot_id, model_version=model_version, **kwargs)
        self["signal_snapshot_id"] = signal_snapshot_id
        self["model_version"] = model_version

    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name)

    def __setattr__(self, name, value):
        self[name] = value

class RetryPolicy(BaseModel):
    max_retries: int = 3
    backoff_factor: float = 1.5

class ExecutionConstraints(BaseModel):
    timeout_seconds: int = 60
    requires_gpu: bool = False

class StructuredPipelineDecision(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    action: PipelineAction
    parameters: Dict[str, Any] = Field(default_factory=dict)
    retry_policy: RetryPolicy = Field(default_factory=RetryPolicy)
    execution_constraints: ExecutionConstraints = Field(default_factory=ExecutionConstraints)
    provenance: Any = Field(default_factory=Provenance)

class PolicyModel:
    def __init__(self):
        self.epsilon = 0.2
        self.decay = 0.99
        from app.services.autonomy.offline_trainer import offline_trainer
        self.trainer = offline_trainer

    def predict(self, context: DocumentContext, current_stage: str, valid_actions: List[PipelineAction]) -> PipelineAction:
        state_dict = state_encoder.encode(context)
        safe_actions = [a for a in valid_actions if policy_shield.validate_action(state_dict, a)]
        if not safe_actions:
            safe_actions = [PipelineAction.SEND_TO_HITL_PRIORITY]
            
        if random.random() < self.epsilon:
            if state_dict.get("validation_risk", 0.0) > 0.7:
                # Force exploit
                pass
            elif state_dict.get("tenant_tier", 0.5) >= 1.0:
                # Epsilon 0 for Production Critical
                pass
            else:
                self.epsilon *= self.decay
                return random.choice(safe_actions)
            
        state_key = self.trainer._discretize_context(context.model_dump())
        weights = self.trainer.model_weights.get(state_key, {})
        
        best_action = None
        best_score = -9999.0
        
        for action in safe_actions:
            score = weights.get(action.value, 0.0)
            if score > best_score:
                best_score = score
                best_action = action
                
        return best_action or safe_actions[0]

class PipelineController:
    def __init__(self):
        self.policy_model = PolicyModel()
        
    def route(self, context: DocumentContext, current_stage: str, db: Session) -> StructuredPipelineDecision:
        decision_action = PipelineAction.UNKNOWN
        reason = ""
        parameters = {}
        
        if context.ocr_failures_count >= 3 or context.validation_failures_count >= 3:
            decision_action = PipelineAction.SEND_TO_HITL_PRIORITY
            reason = "AUTO_HALT: Loop detection triggered"
            
        elif current_stage in ["PRE_OCR", "START"]:
            decision_action = PipelineAction.OCR_REPROCESS_ENHANCED
            reason = "Initial ingestion: Proceed to OCR extraction"

        elif current_stage == "POST_OCR":
            actions = [PipelineAction.OCR_REPROCESS_ENHANCED, PipelineAction.PROCEED_TO_CLASSIFICATION]
            decision_action = self.policy_model.predict(context, current_stage, actions)
            reason = f"Policy selected {decision_action.value} at POST_OCR"
            if decision_action == PipelineAction.OCR_REPROCESS_ENHANCED:
                parameters = {"use_ensemble": True}
                
        elif current_stage == "POST_CLASSIFICATION":
            actions = [PipelineAction.CLASSIFY_USING_ML_STRONG_MODEL, PipelineAction.PROCEED_TO_EXTRACTION]
            decision_action = self.policy_model.predict(context, current_stage, actions)
            reason = f"Policy selected {decision_action.value} at POST_CLASSIFICATION"
                
        elif current_stage == "POST_EXTRACTION":
            actions = [PipelineAction.SWITCH_TO_FALLBACK_EXTRACTION, PipelineAction.PROCEED_TO_VALIDATION]
            decision_action = self.policy_model.predict(context, current_stage, actions)
            reason = f"Policy selected {decision_action.value} at POST_EXTRACTION"
                
        elif current_stage == "POST_VALIDATION":
            if context.is_valid:
                decision_action = PipelineAction.PROCEED_TO_INDEXING
                reason = "Document is valid"
            else:
                actions = [PipelineAction.SEND_TO_HITL_PRIORITY, PipelineAction.HOLD_FOR_REVIEW]
                decision_action = self.policy_model.predict(context, current_stage, actions)
                reason = f"Policy selected {decision_action.value} for failed validation"
                
        else:
            decision_action = PipelineAction.HOLD_FOR_REVIEW
            reason = f"Unknown stage {current_stage}"
            
        logger.info(f"Routing Decision [Doc: {context.document_id}] | Stage: {current_stage} | Decision: {decision_action.value} | Reason: {reason}")
        
        structured_decision = StructuredPipelineDecision(
            action=decision_action,
            parameters=parameters,
            retry_policy=RetryPolicy(),
            execution_constraints=ExecutionConstraints(),
            provenance=Provenance(signal_snapshot_id="current", model_version="policy_v1")
        )
        
        if db:
            try:
                record = PipelineDecision(
                    document_id=uuid.UUID(context.document_id),
                    stage=current_stage,
                    decision=structured_decision.model_dump(),
                    reason=reason,
                    model_version=structured_decision.provenance.model_version
                )
                db.add(record)
                db.commit()
            except Exception as ex:
                logger.warning(f"Could not persist PipelineDecision record: {ex}")
            
        return structured_decision
