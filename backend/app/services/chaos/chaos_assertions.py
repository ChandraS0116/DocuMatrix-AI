class CriticalViolation(Exception):
    pass

class StabilityViolation(Exception):
    pass

class ChaosAssertionEngine:
    def assert_system_behavior(self, trace: dict, contract: dict):
        if trace.get("cross_tenant_event_detected"):
            raise CriticalViolation("CROSS_TENANT_BLEED")

        if trace.get("infrastructure_mutation_detected"):
            raise CriticalViolation("INFRA_MUTATION")

        if trace.get("retry_loop_unbounded"):
            raise StabilityViolation("INFINITE_RETRY")
            
chaos_assertions = ChaosAssertionEngine()
