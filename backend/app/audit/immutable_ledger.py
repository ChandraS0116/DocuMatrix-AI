import hashlib
import json
import logging
import uuid
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class ImmutableLedger:
    def __init__(self):
        self.ledger = []
        self.last_hash = "GENESIS_HASH"

    def _hash_payload(self, payload: Dict[str, Any]) -> str:
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    def append(self, tenant_id: str, action: str, input_payload: Dict, output_payload: Dict) -> str:
        event_id = str(uuid.uuid4())
        input_hash = self._hash_payload(input_payload)
        output_hash = self._hash_payload(output_payload)
        
        entry = {
            "event_id": event_id,
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "previous_hash": self.last_hash
        }
        
        entry_hash = self._hash_payload(entry)
        self.ledger.append(entry)
        self.last_hash = entry_hash
        
        logger.info(f"[LEDGER] Appended {event_id} for tenant {tenant_id}. Hash: {entry_hash}")
        return entry_hash

immutable_ledger = ImmutableLedger()
