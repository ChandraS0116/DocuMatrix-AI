import hashlib
import secrets
from app.models.database import ApiKey
from sqlalchemy.orm import Session
from fastapi import HTTPException

class ApiKeyManager:
    def generate_key(self, tenant_id: str, scopes: list, db: Session):
        raw_key = f"docintel_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        db_key = ApiKey(key_hash=key_hash, tenant_id=tenant_id, scopes=scopes)
        db.add(db_key)
        db.commit()
        
        return raw_key
        
    def validate_key(self, raw_key: str, required_scope: str, db: Session) -> str:
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        db_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.revoked == False).first()
        
        if not db_key:
            raise HTTPException(status_code=403, detail="Invalid API Key")
            
        if required_scope not in db_key.scopes:
            raise HTTPException(status_code=403, detail=f"Forbidden: Requires {required_scope} scope")
            
        return db_key.tenant_id

api_key_manager = ApiKeyManager()
