import os
import uuid
import json
import time
import hashlib
import shutil
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Document, AuditLog
from app.services.security.auth import get_current_user, User
from app.services.storage.minio import minio_service
from app.services.processing.tasks import process_document_task

upload_router = APIRouter()

UPLOAD_DIR = "/tmp/algoleap_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_session_dir(session_id: str):
    return os.path.join(UPLOAD_DIR, session_id)

def get_metadata_path(session_id: str):
    return os.path.join(get_session_dir(session_id), "metadata.json")

async def cleanup_abandoned_sessions():
    while True:
        try:
            now = time.time()
            if os.path.exists(UPLOAD_DIR):
                for session_id in os.listdir(UPLOAD_DIR):
                    session_dir = get_session_dir(session_id)
                    metadata_path = get_metadata_path(session_id)
                    if os.path.exists(metadata_path):
                        try:
                            with open(metadata_path, "r") as f:
                                meta = json.load(f)
                            # Cleanup sessions older than 24 hours
                            if now - meta.get("created_at", now) > 86400:
                                shutil.rmtree(session_dir, ignore_errors=True)
                        except Exception:
                            pass
        except Exception as e:
            print(f"Cleanup task error: {e}")
            
        await asyncio.sleep(3600) # Run every hour

@upload_router.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_abandoned_sessions())

@upload_router.post("/init")
async def init_upload(
    filename: str = Form(...),
    file_size: int = Form(...),
    total_chunks: int = Form(...),
    current_user: User = Depends(get_current_user)
):
    session_id = str(uuid.uuid4())
    session_dir = get_session_dir(session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    metadata = {
        "session_id": session_id,
        "tenant_id": current_user.tenant_id,
        "username": current_user.username,
        "filename": filename,
        "file_size": file_size,
        "total_chunks": total_chunks,
        "uploaded_chunks": [],
        "created_at": time.time(),
        "status": "uploading"
    }
    
    with open(get_metadata_path(session_id), "w") as f:
        json.dump(metadata, f)
        
    return {"upload_session_id": session_id, "chunk_size_recommendation_mb": 8}

@upload_router.post("/chunk")
async def upload_chunk(
    upload_session_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk_checksum: str = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    session_dir = get_session_dir(upload_session_id)
    metadata_path = get_metadata_path(upload_session_id)
    
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    chunk_data = await file.read()
    
    # Verify checksum if provided
    if chunk_checksum:
        actual_hash = hashlib.sha256(chunk_data).hexdigest()
        if actual_hash != chunk_checksum:
            raise HTTPException(status_code=400, detail="Chunk checksum mismatch")
            
    chunk_path = os.path.join(session_dir, f"chunk_{chunk_index}")
    with open(chunk_path, "wb") as f:
        f.write(chunk_data)
        
    # Update metadata
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    if chunk_index not in metadata["uploaded_chunks"]:
        metadata["uploaded_chunks"].append(chunk_index)
        
    with open(metadata_path, "w") as f:
        json.dump(metadata, f)
        
    return {"status": "ok", "chunk_index": chunk_index}

@upload_router.get("/status/{upload_session_id}")
async def get_upload_status(
    upload_session_id: str,
    current_user: User = Depends(get_current_user)
):
    metadata_path = get_metadata_path(upload_session_id)
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    if metadata["tenant_id"] != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return {
        "upload_session_id": upload_session_id,
        "uploaded_chunks": metadata["uploaded_chunks"],
        "total_chunks": metadata["total_chunks"],
        "status": metadata["status"]
    }

@upload_router.post("/complete")
async def complete_upload(
    upload_session_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_dir = get_session_dir(upload_session_id)
    metadata_path = get_metadata_path(upload_session_id)
    
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    if len(metadata["uploaded_chunks"]) < metadata["total_chunks"]:
        raise HTTPException(status_code=400, detail=f"Missing chunks. Expected {metadata['total_chunks']}, got {len(metadata['uploaded_chunks'])}")
        
    # Reassemble file
    final_file_path = os.path.join(session_dir, "assembled_file")
    sha256_hash = hashlib.sha256()
    
    with open(final_file_path, "wb") as outfile:
        for i in range(metadata["total_chunks"]):
            chunk_path = os.path.join(session_dir, f"chunk_{i}")
            with open(chunk_path, "rb") as infile:
                chunk_data = infile.read()
                outfile.write(chunk_data)
                sha256_hash.update(chunk_data)
                
    final_hash = sha256_hash.hexdigest()
    
    # Store in MinIO and DB
    doc_id = uuid.uuid4()
    storage_path = f"raw/{doc_id}_{metadata['filename']}"
    
    with open(final_file_path, "rb") as f:
        minio_service.upload_file(f.read(), storage_path)
        
    mime_type = "application/pdf" # Defaulting for simplicity in demo
    
    new_doc = Document(
        id=doc_id,
        tenant_id=current_user.tenant_id,
        filename=metadata['filename'],
        storage_path=storage_path,
        mime_type=mime_type,
        file_size_bytes=metadata['file_size'],
        sha256_hash=final_hash,
        status="UPLOADED"
    )
    db.add(new_doc)
    
    audit_log = AuditLog(
        tenant_id=current_user.tenant_id, 
        document_id=doc_id, 
        transition_state="UPLOADED", 
        actor=current_user.username,
        metadata_json={"upload_session_id": upload_session_id, "chunked": True}
    )
    db.add(audit_log)
    db.commit()
    
    # Cleanup session
    shutil.rmtree(session_dir, ignore_errors=True)
    
    # Trigger processing
    process_document_task.delay(str(doc_id))
    
    return {"document_id": str(doc_id), "status": "UPLOADED", "hash": final_hash}

@upload_router.post("/cancel")
async def cancel_upload(
    upload_session_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    session_dir = get_session_dir(upload_session_id)
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
    return {"status": "cancelled"}
