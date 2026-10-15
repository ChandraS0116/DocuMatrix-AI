from abc import ABC, abstractmethod
from app.models.canonical import CanonicalDocument
from app.models.extraction_schemas import ExtractionResult

class DocumentExtractor(ABC):
    @abstractmethod
    def extract(self, document: CanonicalDocument) -> ExtractionResult:
        pass
