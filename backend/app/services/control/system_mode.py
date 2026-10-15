import os
from enum import Enum

class SystemMode(str, Enum):
    PRODUCTION = "production"        # RL disabled
    HYBRID = "hybrid"                # RL suggestions only
    EXPERIMENTAL = "experimental"    # RL fully active

def get_system_mode() -> SystemMode:
    mode_str = os.getenv("DOCINTEL_SYSTEM_MODE", "PRODUCTION").upper()
    try:
        return SystemMode[mode_str]
    except KeyError:
        return SystemMode.PRODUCTION

class SystemModeProvider:
    def get_mode(self) -> SystemMode:
        return get_system_mode()

system_mode_provider = SystemModeProvider()
