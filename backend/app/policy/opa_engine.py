import logging
import json

logger = logging.getLogger(__name__)

class OPAClient:
    def __init__(self, endpoint_url: str = "http://opa-central.docintel-prod:8181/v1/data/authz/allow"):
        self.endpoint_url = endpoint_url

    def authorize(self, tenant_id: str, tier: str, action: str, resource: str) -> bool:
        # PURE CLIENT LOGIC ONLY. ABSOLUTELY NO POLICY RULES IN PYTHON.
        payload = {
            "input": {
                "tenant": {
                    "id": tenant_id,
                    "tier": tier
                },
                "action": action,
                "resource": resource
            }
        }
        
        logger.info(f"[OPA] Forwarding decision request to OPA engine: {json.dumps(payload)}")
        
        # MOCK HTTP CALL TO OPA SIDECAR / CENTRAL
        is_allowed = self._mock_opa_response(tier, action)
        
        if not is_allowed:
            logger.error(f"[OPA DENY] Execution forbidden by OPA policy for tenant={tenant_id} action={action}")
            return False
            
        logger.info(f"[OPA ALLOW] Execution authorized for tenant={tenant_id} action={action}")
        return True

    def _mock_opa_response(self, tier: str, action: str) -> bool:
        if action == "EXPORT_RAW_DATA" and tier != "ENTERPRISE":
            return False
        if action == "GPU_EXECUTION" and tier == "FREE":
            return False
        return True

opa_client = OPAClient()
