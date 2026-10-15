import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Tenant, Subscription
from app.billing.stripe_engine import stripe_engine

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupRequest(BaseModel):
    name: str
    email: str
    plan: str = "Starter"

class SignupResponse(BaseModel):
    tenant_id: str
    api_key: str
    message: str

@router.post("/signup", response_model=SignupResponse)
def signup_tenant(request: SignupRequest, db: Session = Depends(get_db)):
    # 1. Generate unique Tenant ID
    tenant_id = f"t_{secrets.token_hex(8)}"
    
    # 2. Generate secure API key
    raw_api_key = secrets.token_urlsafe(32)
    api_key_hash = hashlib.sha256(raw_api_key.encode()).hexdigest()
    
    # 3. Create Stripe Customer
    stripe_customer_id = stripe_engine.create_customer(tenant_id, request.email)
    
    # 4. Create Stripe Subscription
    stripe_sub_id = stripe_engine.create_subscription(stripe_customer_id, request.plan)
    
    # 5. Persist Tenant
    tenant = Tenant(
        tenant_id=tenant_id,
        name=request.name,
        api_key_hash=api_key_hash,
        stripe_customer_id=stripe_customer_id
    )
    db.add(tenant)
    
    # 6. Persist Subscription
    sub = Subscription(
        tenant_id=tenant_id,
        stripe_subscription_id=stripe_sub_id,
        plan_tier=request.plan
    )
    db.add(sub)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create tenant.")
        
    return SignupResponse(
        tenant_id=tenant_id,
        api_key=raw_api_key,
        message="Please save this API key securely. It will not be shown again."
    )
