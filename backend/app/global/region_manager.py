import logging

logger = logging.getLogger(__name__)

class RegionManager:
    def __init__(self):
        self.regions = {
            "ap-south-1": {"status": "ACTIVE", "gpu_capacity": 0.8},
            "eu-west-1": {"status": "ACTIVE", "gpu_capacity": 0.6},
            "us-east-1": {"status": "ACTIVE", "gpu_capacity": 0.9}
        }

    def get_healthy_regions(self):
        return [r for r, data in self.regions.items() if data["status"] == "ACTIVE"]

    def report_heartbeat_loss(self, region_id: str):
        if region_id in self.regions:
            self.regions[region_id]["status"] = "DEAD"
            logger.critical(f"[REGION MANAGER] Region {region_id} marked as DEAD.")

region_manager = RegionManager()
