from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SearchDocumentModel(BaseModel):
    document_id: str
    filename: str
    document_type: str
    processing_status: str
    validation_status: str
    created_at: str
    index_version: str
    searchable_text: str
    tenant_id: str
    shard_routing_key: str = Field(default="")
    index_alias: str = Field(default="documents_v1_hot")
    
    # Security foundations
    owner_id: Optional[str] = None
    visibility: Optional[str] = "PRIVATE"
    
    # Nested structured data
    extracted_fields: Optional[Dict[str, Any]] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    sections: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Elasticsearch explicit mapping template for index creation
ES_MAPPING = {
    "mappings": {
        "properties": {
            "document_id": {"type": "keyword"},
            "filename": {
                "type": "text",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 256}
                }
            },
            "document_type": {"type": "keyword"},
            "processing_status": {"type": "keyword"},
            "validation_status": {"type": "keyword"},
            "created_at": {"type": "date"},
            "index_version": {"type": "keyword"},
            "searchable_text": {"type": "text"},
            "tenant_id": {"type": "keyword"},
            "shard_routing_key": {"type": "keyword"},
            "index_alias": {"type": "keyword"},
            "owner_id": {"type": "keyword"},
            "visibility": {"type": "keyword"},
            "extracted_fields": {"type": "object"},
            "line_items": {"type": "nested"},
            "sections": {"type": "object"}
        }
    }
}

class SearchChunkModel(BaseModel):
    document_id: str
    chunk_id: str
    chunk_index: int
    page_number: int
    source_type: str
    block_ids: List[str]
    text: str
    embedding: List[float]
    embedding_model_version: str
    
    tenant_id: str
    shard_routing_key: str = Field(default="")
    index_alias: str = Field(default="document_chunks_v1_hot")
    visibility: str = "PRIVATE"

ES_CHUNK_MAPPING = {
    "mappings": {
        "properties": {
            "document_id": {"type": "keyword"},
            "chunk_id": {"type": "keyword"},
            "chunk_index": {"type": "integer"},
            "page_number": {"type": "integer"},
            "source_type": {"type": "keyword"},
            "block_ids": {"type": "keyword"},
            "text": {"type": "text"},
            "embedding": {
                "type": "dense_vector",
                "dims": 384,
                "index": True,
                "similarity": "cosine"
            },
            "embedding_model_version": {"type": "keyword"},
            "tenant_id": {"type": "keyword"},
            "visibility": {"type": "keyword"}
        }
    }
}
