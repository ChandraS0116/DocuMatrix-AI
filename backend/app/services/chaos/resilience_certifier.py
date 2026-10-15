import uuid
from datetime import datetime

class ResilienceCertificate:
    def __init__(self, tenant_id: str, scenarios: list, pass_rate: float, degradation_score: int):
        self.system_id = str(uuid.uuid4())
        self.tenant_id = tenant_id
        self.chaos_scenarios_tested = scenarios
        self.pass_rate = pass_rate
        self.worst_case_degradation_score = degradation_score
        self.certified_at = datetime.utcnow().isoformat()
        
    def to_dict(self):
        return vars(self)

class ResilienceCertifier:
    def certify(self, tenant_id: str, validation_reports: list) -> dict:
        all_contracts_passed = all([r.get("contract_compliance_score", 0) == 100 for r in validation_reports])
        no_critical_violations = all([not r.get("critical_violation") for r in validation_reports])
        
        if all_contracts_passed and no_critical_violations:
            scenarios = [r.get("scenario") for r in validation_reports]
            worst_score = min([r.get("classification", {}).get("recovery_score", 100) for r in validation_reports]) if validation_reports else 100
            
            cert = ResilienceCertificate(tenant_id, scenarios, 100.0, worst_score)
            return {"status": "CERTIFIED", "certificate": cert.to_dict()}
            
        return {"status": "FAILED_CERTIFICATION", "reason": "Violations or contract failures detected"}

resilience_certifier = ResilienceCertifier()
