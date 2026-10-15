from fastapi import APIRouter
from app.services.cutover.deployment_mode import DeploymentMode
from app.services.cutover.canary_manager import canary_manager
from app.services.cutover.traffic_splitter import traffic_splitter

router = APIRouter(prefix="/deploy", tags=["Production Cutover"])

@router.post("/canary")
def deploy_canary():
    DeploymentMode.set_mode(DeploymentMode.CANARY)
    active_tenants = [f"tenant_{i}" for i in range(100)]
    pct = canary_manager.advance_rollout(active_tenants)
    return {"status": "canary_advanced", "rollout_percentage": pct}

@router.post("/shadow")
def deploy_shadow():
    DeploymentMode.set_mode(DeploymentMode.SHADOW)
    return {"status": "shadow_mode_active"}

@router.post("/rollback")
def deploy_rollback():
    DeploymentMode.set_mode(DeploymentMode.DISABLED)
    canary_manager.rollback()
    return {"status": "rolled_back"}

@router.get("/status")
def deploy_status():
    return {
        "mode": DeploymentMode.current(),
        "canary_tenants_count": len(traffic_splitter.canary_group)
    }
