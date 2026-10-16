import hashlib
import json

class DecisionFreezer:
    def freeze(self, decision):
        action = getattr(decision, "action", None)
        if action is None and isinstance(decision, dict):
            action = decision.get("action")
            
        params = getattr(decision, "parameters", None)
        if params is None and isinstance(decision, dict):
            params = decision.get("parameters", {})
            
        source = getattr(decision, "source", None)
        if source is None:
            prov = getattr(decision, "provenance", None)
            if isinstance(prov, dict):
                source = prov.get("source")
            elif prov is not None:
                source = getattr(prov, "source", None)
            elif isinstance(decision, dict):
                source = decision.get("source")
                
        frozen = {
            "decision_id": self._hash(decision),
            "action": str(action),
            "parameters": params or {},
            "source": str(source or "UNKNOWN"),
            "locked": True
        }
        return frozen

    def _hash(self, obj):
        obj_dict = vars(obj) if hasattr(obj, "__dict__") else obj
        return hashlib.sha256(
            json.dumps(obj_dict, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()

decision_freezer = DecisionFreezer()
