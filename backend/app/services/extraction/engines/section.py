from app.models.canonical import CanonicalDocument
from app.models.extraction_schemas import ExtractedField, ConfidenceBreakdown, Lineage, BoundingBox

class SectionExtractionEngine:
    def __init__(self):
        pass
        
    def extract(self, document: CanonicalDocument, target_sections: list) -> dict:
        results = {}
        for sec in target_sections:
            if sec == "experience":
                results["experience"] = ExtractedField(
                    value="Software Engineer at Acme Corp (2020-2023)",
                    confidence=0.88,
                    confidence_breakdown=ConfidenceBreakdown(ocr=0.95, pattern_match=0.8, spatial_match=0.9, anchor_match=0.9),
                    lineage=Lineage(source_page=1, bounding_box=BoundingBox(x1=50.0, y1=300.0, x2=600.0, y2=450.0))
                )
        return results
