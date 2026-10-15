from pydantic import BaseModel
from typing import Dict, Any

class Transition(BaseModel):
    state: Dict[str, Any]
    action: str
    next_state: Dict[str, Any]
    reward: float
    done: bool
