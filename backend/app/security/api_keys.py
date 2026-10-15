import hashlib
from fastapi import Security, HTTPException, Depends
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Tenant, Subscription

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=True)

def get_api_key_context(api_key: str = Security(api_key_header), db: Session = Depends(get_db)):
    """
    Dependency to validate X-API-KEY.
    Hashes the incoming key and verifies it against the DB.
    """
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    tenant = db.query(Tenant).filter(Tenant.api_key_hash == key_hash).first()
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    subscription = db.query(Subscription).filter(Subscription.tenant_id == tenant.tenant_id).first()
    if not subscription or subscription.status != "active":
        raise HTTPException(status_code=403, detail="Subscription inactive or missing")
        
    return {
        "tenant_id": tenant.tenant_id,
        "plan": subscription.plan_tier
    }
