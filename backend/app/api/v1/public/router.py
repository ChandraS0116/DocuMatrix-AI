from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.security.api_keys import get_api_key_context
from app.models.database import Document, OcrResult, ExtractedData
import uuid

# These would ideally be imported from core services, but we mock the trigger here for simplicity of the public routing.
from app.services.processing.tasks import process_document_task
from app.services.storage.minio import minio_service

public_router = APIRouter()

@public_router.post("/documents/upload")
def upload_document(
    file: UploadFile = File(...), 
    context: dict = Depends(get_api_key_context), 
    db: Session = Depends(get_db)
):
    tenant_id = context["tenant_id"]
    
    # In a real impl, stream this to S3/MinIO
    file_bytes = file.file.read()
    storage_path = f"{tenant_id}/{uuid.uuid4()}_{file.filename}"
    minio_service.upload_file(file_bytes, storage_path)
    
    doc = Document(
        tenant_id=tenant_id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        file_size_bytes=len(file_bytes)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    process_document_task.delay(str(doc.id))
    
    return {"id": str(doc.id), "status": doc.status}

@public_router.get("/documents/{document_id}")
def get_document(document_id: str, context: dict = Depends(get_api_key_context), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == context["tenant_id"]).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "id": str(doc.id),
        "filename": doc.filename,
        "status": doc.status,
        "created_at": doc.created_at
    }

@public_router.get("/documents/{document_id}/extract")
def get_extraction(document_id: str, context: dict = Depends(get_api_key_context), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == context["tenant_id"]).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    extracted = db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
    if not extracted:
        return {"status": "processing or unavailable"}
        
    return extracted.structured_json

@public_router.post("/search/query")
def search_documents(query: dict, context: dict = Depends(get_api_key_context)):
    from app.services.search.elasticsearch_client import es_client
    # Assume query dict has 'text'
    results = es_client.search(
        tenant_id=context["tenant_id"],
        query_text=query.get("text", "")
    )
    return {"results": results}

@public_router.post("/rag/query")
def rag_query(query: dict, context: dict = Depends(get_api_key_context)):
    # Mock RAG response using search
    return {"answer": f"Simulated RAG answer for: {query.get('text')}"}
