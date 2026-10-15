import os
try:
    import stripe
except ImportError:
    stripe = None
from app.observability.logger import get_logger

logger = get_logger(__name__)

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
if stripe:
    stripe.api_key = STRIPE_SECRET_KEY

# Plan mappings
PLANS = {
    "Starter": {"price_id": os.getenv("STRIPE_PRICE_STARTER", "price_starter_mock"), "pages": 500, "gpu_allowed": False},
    "Pro": {"price_id": os.getenv("STRIPE_PRICE_PRO", "price_pro_mock"), "pages": 10000, "gpu_allowed": True},
    "Enterprise": {"price_id": os.getenv("STRIPE_PRICE_ENT", "price_ent_mock"), "pages": -1, "gpu_allowed": True}
}

class StripeEngine:
    def __init__(self):
        self.mock_mode = not bool(STRIPE_SECRET_KEY) or not stripe
        if self.mock_mode:
            logger.warning("Stripe Engine running in MOCK mode (STRIPE_SECRET_KEY missing).")

    def create_customer(self, tenant_id: str, email: str = None) -> str:
        if self.mock_mode:
            return f"cus_mock_{tenant_id}"
        
        try:
            customer = stripe.Customer.create(
                metadata={"tenant_id": tenant_id},
                email=email
            )
            return customer.id
        except Exception as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            raise

    def create_subscription(self, customer_id: str, plan_name: str) -> str:
        if self.mock_mode:
            return f"sub_mock_{customer_id}_{plan_name}"
            
        plan = PLANS.get(plan_name)
        if not plan:
            raise ValueError(f"Unknown plan: {plan_name}")
            
        try:
            sub = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": plan["price_id"]}],
            )
            return sub.id
        except Exception as e:
            logger.error(f"Failed to create Stripe subscription: {e}")
            raise

    def enforce_quota(self, plan_name: str, current_usage: int, is_gpu_request: bool) -> bool:
        plan = PLANS.get(plan_name)
        if not plan:
            return False
            
        if is_gpu_request and not plan["gpu_allowed"]:
            return False
            
        if plan["pages"] != -1 and current_usage >= plan["pages"]:
            return False
            
        return True

stripe_engine = StripeEngine()
