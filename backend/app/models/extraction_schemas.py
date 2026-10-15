from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Lineage(BaseModel):
    source_page: int
    bounding_box: Optional[BoundingBox] = None

class ConfidenceBreakdown(BaseModel):
    ocr: float
    pattern_match: float
    spatial_match: float
    anchor_match: float

class ExtractedField(BaseModel):
    value: Any
    confidence: float
    confidence_breakdown: ConfidenceBreakdown
    lineage: Lineage

class ExtractionResult(BaseModel):
    document_type: str
    model_version: str
    extracted_entities: dict
    entity_spans: list
    confidence_scores: dict
    layout_features_used: dict
    inference_latency_ms: float
    fallback_used: bool
