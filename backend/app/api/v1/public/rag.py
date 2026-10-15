from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/rag", tags=["Public RAG"])

class RAGQuery(BaseModel):
    question: str

def verify_token(authorization: str = None):
    return authorization

@router.post("/query")
def rag_query(req: RAGQuery, token: str = Depends(verify_token)):
    return {"answer": "Generated answer based on enterprise context", "sources": []}
