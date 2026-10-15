import logging

logger = logging.getLogger(__name__)

class DataResidencyEnforcer:
    def can_leave_region(self, tenant_id: str, current_region: str, target_region: str) -> bool:
        if "eu-" in current_region and "eu-" not in target_region:
            logger.critical(f"[COMPLIANCE] GDPR BLOCK: Tenant {tenant_id} data cannot leave {current_region} for {target_region}.")
            return False
        return True

data_residency_enforcer = DataResidencyEnforcer()
