from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
import uuid

router = APIRouter(prefix="/documents", tags=["Public Documents"])

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.split(" ")[1]

@router.post("/upload")
def upload_document(file: UploadFile = File(...), token: str = Depends(verify_token)):
    doc_id = str(uuid.uuid4())
    return {"id": doc_id, "status": "uploaded", "filename": file.filename}

@router.get("/{document_id}")
def get_document(document_id: str, token: str = Depends(verify_token)):
    return {"id": document_id, "status": "processed"}

@router.post("/{document_id}/extract")
def extract_document(document_id: str, token: str = Depends(verify_token)):
    return {"id": document_id, "status": "extraction_queued"}

@router.get("/{document_id}/status")
def get_document_status(document_id: str, token: str = Depends(verify_token)):
    return {"id": document_id, "status": "completed"}
