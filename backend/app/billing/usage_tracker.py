from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.database import BillingEvent
from app.observability.logger import get_logger

logger = get_logger(__name__)

class UsageTracker:
    def track_usage(self, db: Session, tenant_id: str, event_type: str, units: float, cost: float, idempotency_key: str):
        """
        Records an immutable billing event.
        Uses idempotency_key to prevent duplicate charging on Celery retries.
        """
        try:
            event = BillingEvent(
                tenant_id=tenant_id,
                idempotency_key=idempotency_key,
                event_type=event_type,
                units=units,
                cost=cost
            )
            db.add(event)
            db.commit()
            logger.info(f"Billing event recorded: {tenant_id} | {event_type} | {units} units | Cost: ${cost}")
        except IntegrityError:
            # Idempotency key collision means we already tracked this usage
            db.rollback()
            logger.info(f"Billing event {idempotency_key} already recorded. Ignoring duplicate.")
            pass
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record billing event: {e}")
            raise

usage_tracker = UsageTracker()
