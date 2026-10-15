from app.services.cutover.deployment_mode import DeploymentMode

class ShadowExecutionTarget:
    def __init__(self, queue, isolated_compute_pool, production_gpu_blocked):
        self.queue = queue
        self.isolated_compute_pool = isolated_compute_pool
        self.production_gpu_blocked = production_gpu_blocked

class TrafficSplitter:
    def __init__(self):
        self.canary_group = set()

    def route(self, tenant_id, request):
        mode = DeploymentMode.current()
        
        if mode == DeploymentMode.SHADOW:
            return {
                "primary": "STABLE_PIPELINE",
                "shadow": self._route_shadow(request)
            }
            
        if mode == DeploymentMode.CANARY:
            if tenant_id in self.canary_group:
                return {"primary": "NEW_PIPELINE"}
            else:
                return {"primary": "STABLE_PIPELINE"}
                
        if mode == DeploymentMode.PRODUCTION:
            return {"primary": "NEW_PIPELINE"}
            
        return {"primary": "STABLE_PIPELINE"}

    def _route_shadow(self, payload):
        return ShadowExecutionTarget(
            queue="shadow",
            isolated_compute_pool=True,
            production_gpu_blocked=True
        )

traffic_splitter = TrafficSplitter()
