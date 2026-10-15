import hashlib
import json

class ExecutionChain:
    def __init__(self):
        self.previous_hash = None

    def canonicalize(self, obj):
        return json.dumps(
            obj,
            sort_keys=True,
            separators=(",", ":"),
            default=str
        ).encode("utf-8")

    def append(self, node_input, node_output):
        h = hashlib.sha256()

        h.update(self.previous_hash.encode() if self.previous_hash else b"GENESIS")
        h.update(self.canonicalize(node_input))
        h.update(self.canonicalize(node_output))

        current_hash = h.hexdigest()
        self.previous_hash = current_hash

        return current_hash
