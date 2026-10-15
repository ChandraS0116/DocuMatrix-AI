from abc import ABC, abstractmethod
from app.models.canonical import CanonicalDocument

class OCRProvider(ABC):
    """
    Abstract Base Class for all OCR Providers.
    Ensures that regardless of the backend (Azure, PaddleOCR, AWS),
    the system receives a uniform CanonicalDocument representation.
    """
    
    @abstractmethod
    def extract_document(self, file_stream: bytes) -> CanonicalDocument:
        """
        Processes a raw document stream and returns the canonical representation.
        """
        pass
