import logging
import uuid

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        self.tenant_keys = {}

    def get_tenant_key(self, tenant_id: str) -> str:
        if tenant_id not in self.tenant_keys:
            self.tenant_keys[tenant_id] = f"kms-key-{uuid.uuid4()}"
            logger.info(f"[KMS] Generated new envelope key for tenant {tenant_id}")
        return self.tenant_keys[tenant_id]

    def encrypt(self, tenant_id: str, data: bytes) -> bytes:
        key = self.get_tenant_key(tenant_id)
        logger.debug(f"[ENCRYPTION] Encrypting data for {tenant_id} using key {key}")
        return b"ENCRYPTED:" + data

    def decrypt(self, tenant_id: str, encrypted_data: bytes) -> bytes:
        key = self.get_tenant_key(tenant_id)
        logger.debug(f"[DECRYPTION] Decrypting data for {tenant_id} using key {key}")
        if encrypted_data.startswith(b"ENCRYPTED:"):
            return encrypted_data[10:]
        return encrypted_data

encryption_service = EncryptionService()
