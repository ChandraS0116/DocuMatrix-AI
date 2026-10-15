from app.services.autonomy.pipeline_controller import StructuredPipelineDecision, PipelineAction
from app.services.control.system_mode import SystemMode, get_system_mode

class ExecutionFirewall:
    def __init__(self, mode: SystemMode = None):
        self.mode = mode or get_system_mode()

    def enforce(self, decision: StructuredPipelineDecision) -> StructuredPipelineDecision:
        if decision.provenance.get("source") == "RL_POLICY":
            if self.mode == SystemMode.PRODUCTION:
                return self._convert_to_advisory(decision, "RL blocked in production mode")
                
            if self.mode == SystemMode.HYBRID:
                decision.provenance["execution_mode"] = "SUGGESTION"
                return decision
                
        return decision

    def _convert_to_advisory(self, decision: StructuredPipelineDecision, reason: str) -> StructuredPipelineDecision:
        decision.provenance["original_action"] = decision.action.value
        decision.provenance["execution_mode"] = "NO_OP"
        decision.provenance["firewall_reason"] = reason
        decision.action = PipelineAction.UNKNOWN 
        return decision
