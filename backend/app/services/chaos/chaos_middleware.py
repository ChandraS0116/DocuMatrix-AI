import copy

class ChaosMiddleware:
    def apply(self, execution_context: dict, chaos_profile: dict) -> dict:
        if not chaos_profile:
            return execution_context

        modified_context = copy.deepcopy(execution_context)
        
        if "ocr_config" not in modified_context:
            modified_context["ocr_config"] = {"latency_ms": 0}
            
        if chaos_profile.get("ocr_latency"):
            modified_context["ocr_config"]["latency_ms"] += chaos_profile["ocr_latency"]

        if chaos_profile.get("redis_failure_rate"):
            modified_context["cache_mode"] = "degraded"

        if chaos_profile.get("gpu_overload"):
            modified_context["inference_mode"] = "cpu_fallback_only"
            
        if chaos_profile.get("search_latency_factor"):
            modified_context["search_latency_factor"] = chaos_profile["search_latency_factor"]
            
        if chaos_profile.get("backpressure_multiplier"):
            modified_context["backpressure_multiplier"] = chaos_profile["backpressure_multiplier"]

        return modified_context

chaos_middleware = ChaosMiddleware()
