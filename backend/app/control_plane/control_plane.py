import logging
from app.policy.opa_engine import opa_client
from app.security.tenant_isolation import tenant_guard, RequestContext

logger = logging.getLogger(__name__)

class GlobalControlPlane:
    def execute_request(self, tenant_id: str, tier: str, action: str, resource: str, signature_valid: bool = True):
        logger.info(f"--- [CONTROL PLANE] Intercepting request from {tenant_id} for {action} ---")
        
        ctx = RequestContext(tenant_id=tenant_id, signature_valid=signature_valid, scope="API")
        try:
            tenant_guard.validate(ctx, allowed_scope="API")
        except PermissionError as e:
            logger.critical(f"Control Plane rejecting request: {str(e)}")
            return {"status": "BLOCKED", "reason": "tenant_validation_failed"}
            
        is_allowed = opa_client.authorize(tenant_id, tier, action, resource)
        if not is_allowed:
            logger.critical(f"Control Plane rejecting request: OPA Denied")
            return {"status": "BLOCKED", "reason": "opa_policy_denied"}
            
        logger.info(f"--- [CONTROL PLANE] Request Authorized. Routing to Data Plane ---")
        return {"status": "AUTHORIZED", "routed_to": "data_plane"}

control_plane = GlobalControlPlane()
