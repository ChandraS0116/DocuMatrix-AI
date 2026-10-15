from app.services.autonomy.pipeline_controller import PipelineAction
from typing import Dict, Any

class PolicyIsolator:
    def evaluate(self, action: PipelineAction, state: Dict[str, Any]) -> str:
        risk_score = state.get("validation_risk", 0.0)
        
        if risk_score > 0.7:
            return "BLOCKED"
            
        if self._affects_core_pipeline(action):
            return "REQUIRES_HITL"
            
        if self._is_exploratory(state):
            return "SUGGEST_ONLY"
            
        return "ALLOWED"
        
    def _affects_core_pipeline(self, action: PipelineAction) -> bool:
        return action in [PipelineAction.SWITCH_TO_FALLBACK_EXTRACTION, PipelineAction.SEND_TO_HITL_PRIORITY]
        
    def _is_exploratory(self, state: Dict[str, Any]) -> bool:
        return state.get("is_exploring", False)
