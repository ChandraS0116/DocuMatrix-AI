class FaultClassifier:
    def classify(self, execution_trace: dict, assertion_result: bool) -> dict:
        fallback_triggered = execution_trace.get("fallback_triggered", False)
        
        fault_class = "SAFE_DEGRADATION"
        severity_score = 0
        
        if fallback_triggered:
            fault_class = "CONTROLLED_FALLBACK"
            severity_score = 1
            
        if execution_trace.get("retry_loop_unbounded"):
            fault_class = "UNSTABLE_BEHAVIOR"
            severity_score = 5
            
        if execution_trace.get("cross_tenant_event_detected"):
            fault_class = "SYSTEM_VIOLATION"
            severity_score = 10
            
        return {
            "fault_class": fault_class,
            "severity_score": severity_score,
            "recovery_score": 100 - (severity_score * 10)
        }

fault_classifier = FaultClassifier()
