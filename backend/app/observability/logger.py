import logging
import json
import uuid
import contextvars
from datetime import datetime

trace_id_var = contextvars.ContextVar("trace_id", default="")
tenant_id_var = contextvars.ContextVar("tenant_id", default="")

class StructuredJSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "trace_id": trace_id_var.get(),
            "tenant_id": tenant_id_var.get(),
            "stage": getattr(record, "stage", "GENERAL"),
            "latency_ms": getattr(record, "latency_ms", None),
            "model_version": getattr(record, "model_version", None)
        }
        
        log_record = {k: v for k, v in log_record.items() if v is not None and v != ""}
        
        return json.dumps(log_record)

def get_logger(name):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredJSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger

def set_trace_id(trace_id=None):
    if not trace_id:
        trace_id = str(uuid.uuid4())
    trace_id_var.set(trace_id)
    return trace_id

def set_tenant_id(tenant_id):
    tenant_id_var.set(tenant_id)
