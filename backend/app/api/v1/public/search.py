from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/search", tags=["Public Search"])

class SearchQuery(BaseModel):
    query: str
    limit: int = 10

def verify_token(authorization: str = None):
    return authorization

@router.post("/query")
def search_documents(req: SearchQuery, token: str = Depends(verify_token)):
    return {"results": [], "query": req.query}
