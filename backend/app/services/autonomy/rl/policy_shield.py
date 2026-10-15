from app.services.autonomy.pipeline_controller import PipelineAction

class PolicyShield:
    def __init__(self):
        self.SAFE_ACTIONS = [
            PipelineAction.OCR_REPROCESS_ENHANCED,
            PipelineAction.CLASSIFY_USING_ML_STRONG_MODEL,
            PipelineAction.SWITCH_TO_FALLBACK_EXTRACTION,
            PipelineAction.SEND_TO_HITL_PRIORITY,
            PipelineAction.PROCEED_TO_CLASSIFICATION,
            PipelineAction.PROCEED_TO_EXTRACTION,
            PipelineAction.PROCEED_TO_VALIDATION,
            PipelineAction.PROCEED_TO_INDEXING,
            PipelineAction.HOLD_FOR_REVIEW
        ]

    def validate_action(self, state: dict, action: PipelineAction) -> bool:
        if action not in self.SAFE_ACTIONS:
            return False
            
        # Example constraint: do not index if validation risk is high
        if state.get("validation_risk", 0.0) >= 1.0 and action == PipelineAction.PROCEED_TO_INDEXING:
            return False
            
        # Example constraint: do not do normal extraction if drift is detected
        if state.get("extraction_drift", 0.0) >= 1.0 and action == PipelineAction.PROCEED_TO_EXTRACTION:
            return False
            
        return True

policy_shield = PolicyShield()
