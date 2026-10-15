from app.services.autonomy.pipeline_controller import StructuredPipelineDecision, PipelineAction
from app.services.control.execution_firewall import ExecutionFirewall
from app.services.control.divergence_monitor import DivergenceMonitor
from app.services.autonomy.graph_builder import graph_builder
from app.services.stability.autonomy_gate import autonomy_gate
from app.services.stability.decision_freezer import decision_freezer
from app.services.control.system_mode import system_mode_provider
from app.services.chaos.chaos_controller import chaos_controller
from app.services.chaos.chaos_middleware import chaos_middleware
import logging

logger = logging.getLogger(__name__)

class ExecutionRouter:
    def __init__(self):
        self.firewall = ExecutionFirewall()
        self.divergence_monitor = DivergenceMonitor()
    def _prov_val(self, prov, key, default=None):
        if isinstance(prov, dict):
            return prov.get(key, default)
        return getattr(prov, key, default)

    def route(self, context, rl_decision: StructuredPipelineDecision, document_id: str, db):
        tenant_id = self._prov_val(rl_decision.provenance, "tenant_id", "default")
        
        from app.services.cutover.traffic_splitter import traffic_splitter
        routing_directive = traffic_splitter.route(tenant_id, rl_decision)
        if "shadow" in routing_directive:
            logger.info("Shadow execution triggered for payload")
            
        chaos_profile = chaos_controller.get_active_profile(tenant_id)
        context = chaos_middleware.apply(context, chaos_profile)
        
        system_mode = system_mode_provider.get_mode().value
        source = self._prov_val(rl_decision.provenance, "source", "UNKNOWN")
        
        if not autonomy_gate.allow(system_mode, source):
            stage = self._prov_val(rl_decision.provenance, "stage", "UNKNOWN")
            rl_decision = self._get_deterministic_decision(context, stage)
            if isinstance(rl_decision.provenance, dict):
                rl_decision.provenance["source"] = "STABILITY_GATE"
            
        frozen_decision = decision_freezer.freeze(rl_decision)
        logger.info(f"FROZEN DECISION: {frozen_decision}")
        
        safe_action = self.firewall.enforce(rl_decision)
        mode = self._prov_val(safe_action.provenance, "execution_mode", "EXECUTE")
        stage = self._prov_val(rl_decision.provenance, "stage", "UNKNOWN")
        
        if mode == "NO_OP":
            det_decision = self._get_deterministic_decision(context, stage)
            self.divergence_monitor.compute_and_log(
                document_id, rl_decision.provenance.get("original_action", "UNKNOWN"), det_decision.action.value, db)
            return graph_builder.build(det_decision, document_id)
            
        if mode == "SUGGESTION":
            logger.info(f"Logging suggestion from RL: {safe_action.action.value}")
            det_decision = self._get_deterministic_decision(context, stage)
            self.divergence_monitor.compute_and_log(document_id, safe_action.action.value, det_decision.action.value, db)
            return graph_builder.build(det_decision, document_id)
            
        self.divergence_monitor.compute_and_log(document_id, safe_action.action.value, safe_action.action.value, db)
        return graph_builder.build(safe_action, document_id)
        
    def _get_deterministic_decision(self, context, stage: str) -> StructuredPipelineDecision:
        from app.services.autonomy.pipeline_controller import ExecutionConstraints, RetryPolicy, Provenance
        decision = StructuredPipelineDecision(
            action=PipelineAction.UNKNOWN, 
            parameters={}, 
            retry_policy=RetryPolicy(), 
            execution_constraints=ExecutionConstraints(), 
            provenance=Provenance(signal_snapshot_id="current", model_version="policy_v1")
        )
        
        if stage in ["PRE_OCR", "START"]:
            decision.action = PipelineAction.OCR_REPROCESS_ENHANCED
        elif stage == "POST_OCR":
            decision.action = PipelineAction.PROCEED_TO_CLASSIFICATION
        elif stage == "POST_CLASSIFICATION":
            decision.action = PipelineAction.PROCEED_TO_EXTRACTION
        elif stage == "POST_EXTRACTION":
            decision.action = PipelineAction.PROCEED_TO_VALIDATION
        elif stage == "POST_VALIDATION":
            decision.action = PipelineAction.PROCEED_TO_INDEXING if getattr(context, "is_valid", False) else PipelineAction.HOLD_FOR_REVIEW
        else:
            decision.action = PipelineAction.HOLD_FOR_REVIEW
            
        return decision

execution_router = ExecutionRouter()
