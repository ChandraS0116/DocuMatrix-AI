import hashlib
import json

class DecisionFreezer:
    def freeze(self, decision):
        frozen = {
            "decision_id": self._hash(decision),
            "action": decision.action if hasattr(decision, "action") else decision.get("action"),
            "parameters": decision.parameters if hasattr(decision, "parameters") else decision.get("parameters", {}),
            "source": decision.source if hasattr(decision, "source") else decision.get("source"),
            "locked": True
        }
        return frozen

    def _hash(self, obj):
        obj_dict = vars(obj) if hasattr(obj, "__dict__") else obj
        return hashlib.sha256(
            json.dumps(obj_dict, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()

decision_freezer = DecisionFreezer()
