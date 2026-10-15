import logging
from typing import Dict

logger = logging.getLogger(__name__)

class GlobalRouter:
    REGIONS = ["ap-south-1", "eu-west-1", "us-east-1"]
    
    def __init__(self):
        self.primary_region = "ap-south-1"
        self.tenant_home_regions: Dict[str, str] = {}

    def get_home_region(self, tenant_id: str) -> str:
        if tenant_id not in self.tenant_home_regions:
            self.tenant_home_regions[tenant_id] = self.primary_region
        return self.tenant_home_regions[tenant_id]

    def route_request(self, tenant_id: str, request_origin: str) -> dict:
        home_region = self.get_home_region(tenant_id)
        assigned_region = home_region
        is_failover = False
        
        if request_origin.startswith("eu-"):
            edge_region = "eu-west-1"
        elif request_origin.startswith("us-"):
            edge_region = "us-east-1"
        else:
            edge_region = "ap-south-1"
            
        if edge_region != home_region:
            is_failover = True
            assigned_region = edge_region
            
        logger.info(f"[ROUTER] tenant={tenant_id} origin={request_origin} edge={edge_region} home={home_region}")
        
        return {
            "routed_region": assigned_region,
            # Strict Rule: failover does NOT migrate write ownership
            "read_only_mode": is_failover, 
            "reason": "failover_read_only" if is_failover else "home_region_active"
        }

global_router = GlobalRouter()
