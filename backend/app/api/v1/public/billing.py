from fastapi import APIRouter, Depends

router = APIRouter(prefix="/billing", tags=["Public Billing"])

def verify_token(authorization: str = None):
    return authorization

@router.get("/usage")
def get_usage(token: str = Depends(verify_token)):
    return {"ocr_pages": 1500, "rag_queries": 200, "embeddings_chunks": 5000}

@router.get("/invoices")
def get_invoices(token: str = Depends(verify_token)):
    return {"invoices": []}

@router.get("/plan")
def get_plan(token: str = Depends(verify_token)):
    return {"plan": "ENTERPRISE", "status": "active"}
