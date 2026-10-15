try:
    import redis
except ImportError:
    redis = None
import json
import os
import uuid

if redis:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
else:
    class MockRedis:
        def get(self, k): return None
        def setex(self, k, t, v): pass
        def set(self, k, v): pass
        def delete(self, *args): pass
        def keys(self, p): return []
    redis_client = MockRedis()

class ChaosController:
    def get_active_profile(self, tenant_id: str):
        data = redis_client.get(f"chaos:{tenant_id}")
        if not data:
            return None
        return json.loads(data)

    def inject(self, tenant_id: str, profile: dict, ttl: int):
        profile_id = str(uuid.uuid4())
        profile["profile_id"] = profile_id
        
        redis_client.setex(
            f"chaos:{tenant_id}",
            ttl,
            json.dumps(profile)
        )
        return profile_id

    def run_validation_pipeline(self, tenant_id: str, execution_trace: dict, chaos_profile: dict):
        from app.services.chaos.fault_contracts import fault_contracts
        from app.services.chaos.chaos_assertions import chaos_assertions
        from app.services.chaos.fault_classifier import fault_classifier
        
        contract_result = fault_contracts.validate(execution_trace, chaos_profile)
        
        critical_violation = False
        try:
            chaos_assertions.assert_system_behavior(execution_trace, contract_result)
        except Exception as e:
            critical_violation = True
            
        classification = fault_classifier.classify(execution_trace, not critical_violation)
        compliance_score = 100 if all(contract_result.values()) else 0
        
        report = {
            "tenant_id": tenant_id,
            "scenario": chaos_profile.get("scenario", "UNKNOWN"),
            "contract_compliance_score": compliance_score,
            "critical_violation": critical_violation,
            "classification": classification
        }
        
        redis_client.set(f"chaos_report:{tenant_id}", json.dumps(report))
        return report

    def stop(self, tenant_id: str):
        redis_client.delete(f"chaos:{tenant_id}")

    def stop_all(self):
        keys = redis_client.keys("chaos:*")
        if keys:
            redis_client.delete(*keys)

chaos_controller = ChaosController()
