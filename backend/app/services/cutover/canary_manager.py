from app.services.cutover.traffic_splitter import traffic_splitter

class CanaryManager:
    def __init__(self):
        self.rollout_phases = [0.05, 0.25, 0.50, 1.0]
        self.current_phase_index = 0
        
    def advance_rollout(self, active_tenants: list):
        if self.current_phase_index < len(self.rollout_phases):
            percentage = self.rollout_phases[self.current_phase_index]
            target_count = max(1, int(len(active_tenants) * percentage))
            traffic_splitter.canary_group = set(active_tenants[:target_count])
            self.current_phase_index += 1
            return percentage
        return 1.0
        
    def rollback(self):
        self.current_phase_index = 0
        traffic_splitter.canary_group.clear()

canary_manager = CanaryManager()
