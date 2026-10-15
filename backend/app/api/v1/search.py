from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.services.search.elasticsearch_client import es_client
from app.services.processing.tasks import index_document_task
from app.services.rag.orchestrator import rag_orchestrator
from app.services.security.auth import get_current_user, User
from app.services.security.rbac import require_role

search_router = APIRouter()

@search_router.get("/search")
async def search_documents(
    q: Optional[str] = Query(None, description="Full-text search query"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    status: Optional[str] = Query(None, description="Filter by processing status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role("VIEWER"))
):
    """
    Search indexed documents. Translates REST params to Elasticsearch DSL.
    Enforces tenant isolation at the DSL level.
    """
    query_dsl = {
        "from": (page - 1) * size,
        "size": size,
        "query": {
            "bool": {
                "must": [],
                "filter": [
                    {"term": {"tenant_id": current_user.tenant_id}}
                ]
            }
        }
    }
    
    if q:
        query_dsl["query"]["bool"]["must"].append({
            "match": {
                "searchable_text": q
            }
        })
    else:
        query_dsl["query"]["bool"]["must"].append({"match_all": {}})
        
    if document_type:
        query_dsl["query"]["bool"]["filter"].append({"term": {"document_type": document_type}})
        
    if status:
        query_dsl["query"]["bool"]["filter"].append({"term": {"processing_status": status}})
        
    res = es_client.search("documents_v1", query_dsl)
    return res

@search_router.get("/search/{document_id}")
async def get_search_document(
    document_id: str,
    current_user: User = Depends(require_role("VIEWER"))
):
    doc = es_client.get_document("documents_v1", document_id)
    if not doc or doc.get("_source", {}).get("tenant_id") != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Document not found in search index")
    return doc

@search_router.post("/search/reindex/{document_id}")
async def reindex_document(
    document_id: str,
    current_user: User = Depends(require_role("TENANT_ADMIN"))
):
    """
    Manually triggers the Celery indexing task for a specific document.
    """
    index_document_task.delay(document_id)
    return {"message": "Reindexing task enqueued", "document_id": document_id}

class AskRequest(BaseModel):
    query: str

@search_router.get("/semantic")
async def semantic_search(
    q: str = Query(..., description="Natural language query"),
    current_user: User = Depends(require_role("VIEWER"))
):
    """
    Pure retrieval endpoint using hybrid kNN + BM25 with strict Tenant Isolation.
    """
    hits = rag_orchestrator.semantic_search(q, tenant_id=current_user.tenant_id, top_k=10)
    return {"results": hits}

@search_router.post("/ask")
async def ask_question(
    request: AskRequest,
    current_user: User = Depends(require_role("VIEWER"))
):
    """
    Core RAG endpoint returning a synthesized answer with exact chunk citations.
    """
    result = rag_orchestrator.ask(request.query, tenant_id=current_user.tenant_id)
    return result
