from typing import List, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Lineage(BaseModel):
    source_page: int
    bounding_box: Optional[BoundingBox] = None
    ocr_engine_version: str
    extraction_model_version: Optional[str] = None
    schema_version: str
    confidence_score: float = Field(ge=0.0, le=1.0)

class Word(BaseModel):
    text: str
    bounding_box: BoundingBox
    confidence: float
    reading_order: int

class Block(BaseModel):
    block_id: str
    block_type: str  # paragraph, table, image
    bounding_box: BoundingBox
    text: str
    reading_order: int
    words: List[Word] = []

class Page(BaseModel):
    page_number: int
    width: float
    height: float
    blocks: List[Block] = []

class CanonicalDocument(BaseModel):
    document_id: str
    pages: List[Page] = []
