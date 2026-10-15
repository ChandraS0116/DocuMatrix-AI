from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class SearchProvider(ABC):
    @abstractmethod
    def index_document(self, index_name: str, document_id: str, document: dict) -> bool:
        """Indexes a document into the search engine."""
        pass
        
    @abstractmethod
    def search(self, index_name: str, query: dict) -> dict:
        """Executes a search query against the engine."""
        pass
        
    @abstractmethod
    def get_document(self, index_name: str, document_id: str) -> Optional[dict]:
        """Retrieves a single indexed document."""
        pass
