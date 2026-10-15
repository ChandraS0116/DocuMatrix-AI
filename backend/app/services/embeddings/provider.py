from abc import ABC, abstractmethod
from typing import List

class EmbeddingProvider(ABC):
    @property
    @abstractmethod
    def model_version(self) -> str:
        pass
        
    @property
    @abstractmethod
    def dimension(self) -> int:
        pass
        
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass
        
    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass
