from fastapi import APIRouter, HTTPException
from app.services.chaos.chaos_controller import chaos_controller
from app.services.chaos.injectors import OCRInjector, MLModelLatencyInjector, RedisInjector, ElasticInjector, QueueInjector
from pydantic import BaseModel

router = APIRouter(prefix="/chaos", tags=["Chaos Engineering"])

class InjectRequest(BaseModel):
    tenant_id: str
    scenario: str
    ttl: int = 300

@router.post("/inject")
def inject_chaos(req: InjectRequest):
    if req.scenario == "GPU_OVERLOAD":
        profile = MLModelLatencyInjector.generate_profile()
    elif req.scenario == "REDIS_PARTIAL_FAILURE":
        profile = RedisInjector.generate_profile(0.4)
    elif req.scenario == "OCR_LATENCY_SPIKE":
        profile = OCRInjector.generate_profile(3000)
    elif req.scenario == "ELASTICSEARCH_DEGRADATION":
        profile = ElasticInjector.generate_profile(5.0)
    elif req.scenario == "CELERY_BACKLOG":
        profile = QueueInjector.generate_profile(10.0)
    else:
        raise HTTPException(status_code=400, detail="Unknown scenario")
        
    profile_id = chaos_controller.inject(req.tenant_id, profile, req.ttl)
    return {"status": "injected", "profile_id": profile_id, "ttl": req.ttl}

@router.post("/stop")
def stop_chaos(tenant_id: str = None):
    if tenant_id:
        chaos_controller.stop(tenant_id)
        return {"status": "stopped", "tenant_id": tenant_id}
    else:
        chaos_controller.stop_all()
        return {"status": "stopped_all"}

@router.get("/status")
def chaos_status(tenant_id: str):
    profile = chaos_controller.get_active_profile(tenant_id)
    return {"tenant_id": tenant_id, "active_profile": profile}

@router.get("/certification/{tenant_id}")
def get_certification(tenant_id: str):
    from app.services.chaos.resilience_certifier import resilience_certifier
    import json
    from app.services.chaos.chaos_controller import redis_client
    
    report_data = redis_client.get(f"chaos_report:{tenant_id}")
    reports = [json.loads(report_data)] if report_data else []
    
    cert_result = resilience_certifier.certify(tenant_id, reports)
    
    return {
        "certification_status": cert_result.get("status"),
        "compliance_score": reports[0].get("contract_compliance_score") if reports else 0,
        "last_validation_report": reports[0] if reports else None,
        "certificate": cert_result.get("certificate")
    }
