from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.models.canonical import CanonicalDocument

class ClassificationResult(BaseModel):
    predicted_class: str
    confidence_score: float
    class_probabilities: Dict[str, float]
    model_version: str
    inference_latency_ms: float
    explanation: Dict[str, Any]
    fallback_used: bool = False

class DocumentClassifier(ABC):
    @abstractmethod
    def predict(self, document: CanonicalDocument) -> ClassificationResult:
        """
        Takes a CanonicalDocument and returns the classification result.
        """
        pass
