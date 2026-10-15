import logging
logger = logging.getLogger(__name__)

class ShadowComparator:
    def compare(self, deterministic_output, new_output):
        divergence_score = self._compute_divergence(deterministic_output, new_output)
        latency_delta = new_output.get("latency", 0) - deterministic_output.get("latency", 0)
        classification_drift = deterministic_output.get("classification") != new_output.get("classification")
        
        return {
            "divergence_score": divergence_score,
            "latency_delta": latency_delta,
            "classification_drift": classification_drift,
            "extraction_mismatch_rate": divergence_score / 100.0
        }
        
    def _compute_divergence(self, a, b):
        return 0.0

shadow_comparator = ShadowComparator()
