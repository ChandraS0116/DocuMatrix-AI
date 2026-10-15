import logging

logger = logging.getLogger(__name__)

class ResilienceScorer:
    def score(self, execution_trace: dict, expected_metrics: dict) -> dict:
        actual_success = execution_trace.get("success", False)
        actual_latency = execution_trace.get("latency_ms", 5000)
        
        success_rate_under_failure = 1.0 if actual_success else 0.0
        rollback_success_rate = 1.0 if execution_trace.get("fallback_triggered", False) else 0.0
        
        expected_latency = expected_metrics.get("latency_ms", 1200)
        latency_degradation_factor = min(1.0, expected_latency / max(actual_latency, 1))
        
        data_integrity_score = 1.0
        
        resilience_score = (
            (success_rate_under_failure * 0.4) +
            (rollback_success_rate * 0.3) +
            (latency_degradation_factor * 0.2) +
            (data_integrity_score * 0.1)
        ) * 100.0
        
        logger.info(f"Computed Resilience Score: {resilience_score}")
        
        return {
            "system_resilience_score": resilience_score,
            "weakest_component_map": "N/A",
            "degradation_signature": f"Latencyx{actual_latency/expected_latency:.2f}"
        }

resilience_scorer = ResilienceScorer()
