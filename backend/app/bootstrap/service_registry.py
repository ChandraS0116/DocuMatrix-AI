class ServiceRegistry:

    def __init__(self):
        self.services = {}

    def register(self, name, service):
        self.services[name] = service

    def get(self, name):
        return self.services.get(name, None)

    def safe_get(self, name):
        svc = self.services.get(name)
        if not svc:
            raise RuntimeError(f"Service {name} not initialized")
        return svc

registry = ServiceRegistry()
