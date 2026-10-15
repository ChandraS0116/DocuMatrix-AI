from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
import hashlib
import uuid
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Public Auth"])

class APIKeyCreateRequest(BaseModel):
    tenant_id: str
    scopes: list[str]

@router.post("/api-key/create")
def create_api_key(req: APIKeyCreateRequest):
    raw_key = f"sk_live_{uuid.uuid4().hex}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    return {
        "api_key": raw_key,
        "tenant_id": req.tenant_id,
        "scopes": req.scopes,
        "created_at": datetime.utcnow().isoformat()
    }

@router.post("/api-key/rotate")
def rotate_api_key():
    return {"status": "rotated"}

@router.get("/api-key/list")
def list_api_keys():
    return {"keys": []}
