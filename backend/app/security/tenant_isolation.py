import logging

logger = logging.getLogger(__name__)

class RequestContext:
    def __init__(self, tenant_id: str, signature_valid: bool, scope: str):
        self.tenant_id = tenant_id
        self.signature_valid = signature_valid
        self.scope = scope

class TenantGuard:
    def validate(self, request_context: RequestContext, allowed_scope: str):
        if request_context.tenant_id is None:
            logger.error("[SECURITY BREACH] Request rejected: Missing tenant_id")
            raise PermissionError("Missing tenant_id")
            
        if not request_context.signature_valid:
            logger.error(f"[SECURITY BREACH] Request rejected for {request_context.tenant_id}: Cryptographic signature invalid")
            raise PermissionError("Invalid signature")
            
        if request_context.scope != allowed_scope:
            logger.error(f"[SECURITY BREACH] Request rejected for {request_context.tenant_id}: Scope {request_context.scope} != {allowed_scope}")
            raise PermissionError("Insufficient scope")
            
        logger.info(f"[SECURITY OK] Tenant {request_context.tenant_id} context verified cryptographically.")
        return True

tenant_guard = TenantGuard()
