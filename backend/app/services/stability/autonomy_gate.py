class AutonomyGate:
    BLOCKED_SYSTEMS = ["AOC", "RL_POLICY", "PIPELINE_EVOLVER", "MODEL_SWITCHER"]

    def allow(self, system_mode, subsystem):
        if system_mode == "PRODUCTION":
            if subsystem in self.BLOCKED_SYSTEMS:
                return False
        return True

autonomy_gate = AutonomyGate()
