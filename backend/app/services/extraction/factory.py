from app.models.canonical import CanonicalDocument
from app.models.extraction_schemas import ExtractionResult
from app.services.extraction.extractor import DocumentExtractor
from app.services.extraction.engines.key_value import KeyValueExtractionEngine
from app.services.extraction.engines.table import TableExtractionEngine
from app.services.extraction.engines.section import SectionExtractionEngine

class InvoiceExtractor(DocumentExtractor):
    def __init__(self):
        self.kv_engine = KeyValueExtractionEngine()
        self.table_engine = TableExtractionEngine()
        
    def extract(self, document: CanonicalDocument) -> ExtractionResult:
        fields = self.kv_engine.extract(document, ["invoice_number", "total_amount"])
        tables = self.table_engine.extract(document, ["line_items"])
        
        return ExtractionResult(
            document_type="invoice",
            extractor_version="v1.0-composed",
            fields=fields,
            tables=tables
        )

class ResumeExtractor(DocumentExtractor):
    def __init__(self):
        self.section_engine = SectionExtractionEngine()
        
    def extract(self, document: CanonicalDocument) -> ExtractionResult:
        sections = self.section_engine.extract(document, ["experience", "education"])
        
        return ExtractionResult(
            document_type="resume",
            extractor_version="v1.0-composed",
            fields={},
            sections=sections
        )

class GenericExtractor(DocumentExtractor):
    def extract(self, document: CanonicalDocument) -> ExtractionResult:
        return ExtractionResult(document_type="generic document", extractor_version="v1.0-fallback", fields={})

class ExtractorFactory:
    @staticmethod
    def get_extractor(document_type: str) -> DocumentExtractor:
        if document_type == "invoice":
            return InvoiceExtractor()
        elif document_type == "resume":
            return ResumeExtractor()
        return GenericExtractor()
