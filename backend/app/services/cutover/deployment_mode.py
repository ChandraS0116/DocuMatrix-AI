class DeploymentMode:
    CANARY = "CANARY"
    SHADOW = "SHADOW"
    PRODUCTION = "PRODUCTION"
    DISABLED = "DISABLED"

    _current_mode = DISABLED

    @classmethod
    def current(cls):
        return cls._current_mode

    @classmethod
    def set_mode(cls, mode):
        cls._current_mode = mode
