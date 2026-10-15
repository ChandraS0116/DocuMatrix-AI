import logging
from app.global.region_manager import region_manager
from app.compliance.data_residency import data_residency_enforcer

logger = logging.getLogger(__name__)

class GlobalIntelligentRouter:
    def route_request(self, tenant_id: str, origin: str, tenant_home: str) -> dict:
        healthy_regions = region_manager.get_healthy_regions()
        
        best_region = tenant_home
        best_score = -1
        
        for region in healthy_regions:
            if not data_residency_enforcer.can_leave_region(tenant_id, origin, region):
                continue

            gpu_avail = region_manager.regions[region]["gpu_capacity"]
            latency = 10 if region == origin else 150
            affinity = 100 if region == tenant_home else 0
            
            score = (1000 / latency) + (gpu_avail * 100) + affinity
            if score > best_score:
                best_score = score
                best_region = region
                
        is_read_only = (best_region != tenant_home)
        
        if best_score == -1:
             logger.critical(f"[ROUTER] NO VALID REGIONS for tenant={tenant_id} origin={origin}. Dropping request.")
             return {"status": "BLOCKED", "reason": "no_valid_regions"}
             
        logger.info(f"[ROUTER] tenant={tenant_id} origin={origin} routed_to={best_region} score={best_score:.2f} read_only={is_read_only}")
        return {"status": "ROUTED", "region": best_region, "read_only": is_read_only}

global_intelligent_router = GlobalIntelligentRouter()
