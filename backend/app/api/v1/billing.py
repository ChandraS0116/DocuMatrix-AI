from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.database import BillingUsageEvent, TenantSubscription
from app.services.billing.subscription_manager import subscription_manager
from sqlalchemy import func
from datetime import datetime, timedelta
import os
try:
    import stripe
except ImportError:
    stripe = None
from fastapi import Request
from sqlalchemy.exc import IntegrityError
from app.models.database import StripeWebhookEvent, Subscription

router = APIRouter(prefix="/billing", tags=["Billing"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/usage/{tenant_id}")
def get_tenant_usage(tenant_id: str, db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    usage_stats = db.query(
        BillingUsageEvent.event_type, 
        func.sum(BillingUsageEvent.units_consumed).label("total_units"),
        func.sum(BillingUsageEvent.cost_usd).label("total_cost")
    ).filter(
        BillingUsageEvent.tenant_id == tenant_id,
        BillingUsageEvent.timestamp >= thirty_days_ago
    ).group_by(BillingUsageEvent.event_type).all()
    
    return {
        "tenant_id": tenant_id,
        "usage": [{"type": u.event_type, "units": u.total_units, "cost": u.total_cost} for u in usage_stats]
    }

@router.get("/plan/{tenant_id}")
def get_tenant_plan(tenant_id: str, db: Session = Depends(get_db)):
    plan = subscription_manager.get_tenant_plan(tenant_id, db)
    return plan

@router.post("/upgrade-plan")
def upgrade_plan(tenant_id: str, new_plan: str, db: Session = Depends(get_db)):
    if new_plan not in ["PRO", "ENTERPRISE"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if not sub:
        sub = TenantSubscription(tenant_id=tenant_id)
        db.add(sub)
        
    sub.plan_type = new_plan
    db.commit()
    return {"status": "success", "new_plan": new_plan}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not stripe:
        return {"status": "error", "message": "Stripe module not installed"}
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        # Mock mode allows bypass
        event = await request.json()
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event.get("id")
    event_type = event.get("type")
    
    # Check for replay
    try:
        wh_event = StripeWebhookEvent(
            stripe_event_id=event_id,
            event_type=event_type
        )
        db.add(wh_event)
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "ignored", "reason": "duplicate event"}
        
    # Handle specific events
    if event_type == "customer.subscription.deleted":
        sub_id = event["data"]["object"]["id"]
        sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == sub_id).first()
        if sub:
            sub.status = "canceled"
            db.commit()
            
    elif event_type == "invoice.payment_failed":
        customer_id = event["data"]["object"]["customer"]
        # In a real app we'd pause the subscription based on tenant's stripe_customer_id
        pass

    return {"status": "success"}
