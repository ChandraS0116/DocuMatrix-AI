import logging
import time
from typing import Optional
from app.models.canonical import CanonicalDocument
from app.models.extraction_schemas import ExtractionResult
from app.services.extraction.factory import ExtractorFactory

logger = logging.getLogger(__name__)

class HybridFallbackExtractor:
    def extract(self, document: CanonicalDocument, document_type: str = "generic document") -> ExtractionResult:
        logger.info(f"Using HybridFallbackExtractor for type: {document_type}")
        start_time = time.time()
        
        extractor = ExtractorFactory.get_extractor(document_type)
        old_result = extractor.extract(document)
        
        latency = (time.time() - start_time) * 1000
        
        entities = {}
        confidences = {}
        
        if hasattr(old_result, 'fields') and old_result.fields:
            for k, v in old_result.fields.items():
                entities[k] = v.value
                confidences[k] = v.confidence
                
        return ExtractionResult(
            document_type=document_type,
            model_version=old_result.extractor_version,
            extracted_entities=entities,
            entity_spans=[],  
            confidence_scores=confidences,
            layout_features_used={"fallback_heuristic": True},
            inference_latency_ms=latency,
            fallback_used=True
        )
