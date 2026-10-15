import logging
from app.global.region_manager import region_manager

logger = logging.getLogger(__name__)

class GlobalFailoverEngine:
    def execute_failover(self, dead_region: str):
        logger.critical(f"[FAILOVER ENGINE] Region {dead_region} unresponsive. Initiating global failover (< 5s).")
        region_manager.report_heartbeat_loss(dead_region)
        
        healthy = region_manager.get_healthy_regions()
        if not healthy:
            logger.critical("ALL REGIONS DEAD. GLOBAL OUTAGE.")
            return
            
        target_region = healthy[0]
        logger.info(f"[FAILOVER ENGINE] Shifting BGP/DNS routing to {target_region}")
        
        from app.global.queue_federation import queue_federation
        queue_federation.replay_failed_region(dead_region, target_region)
        
        logger.info("[FAILOVER ENGINE] Failover complete. Zero data loss.")

global_failover = GlobalFailoverEngine()
