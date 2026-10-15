from app.services.embeddings.provider import EmbeddingProvider
from typing import List

class LocalSentenceTransformerProvider(EmbeddingProvider):
    def __init__(self):
        # Mocking for architectural foundation without heavy local downloads
        self._model_version = "all-MiniLM-L6-v2_v1.0"
        self._dimension = 384
        
    @property
    def model_version(self) -> str:
        return self._model_version
        
    @property
    def dimension(self) -> int:
        return self._dimension
        
    def embed_text(self, text: str) -> List[float]:
        return [0.1] * self._dimension
        
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [[0.1] * self._dimension for _ in texts]

embedding_provider = LocalSentenceTransformerProvider()
