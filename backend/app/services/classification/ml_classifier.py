import time
import logging
import random
from typing import Dict, Any, List
from app.models.canonical import CanonicalDocument
from app.services.classification.classifier import DocumentClassifier, ClassificationResult
from app.services.classification.hybrid_classifier import HybridHeuristicClassifier
from app.services.ml.model_registry import model_registry

logger = logging.getLogger(__name__)

class MLDocumentClassifier(DocumentClassifier):
    def __init__(self):
        self.fallback_classifier = HybridHeuristicClassifier()
        
    def _prepare_inputs(self, document: CanonicalDocument) -> dict:
        tokens = []
        bboxes = []
        page_indices = []
        block_types = []
        block_ids = []
        
        for page in document.pages:
            for block in page.blocks:
                block_type_encoding = 1 if block.block_type == "text" else 2
                for line in block.lines:
                    for word in line.text.split():
                        tokens.append(word)
                        # Normalize bbox (mock normalization for 0-1000 scale)
                        x1 = min(int((line.bounding_box.x1 / max(page.width, 1)) * 1000), 1000)
                        y1 = min(int((line.bounding_box.y1 / max(page.height, 1)) * 1000), 1000)
                        x2 = min(int((line.bounding_box.x2 / max(page.width, 1)) * 1000), 1000)
                        y2 = min(int((line.bounding_box.y2 / max(page.height, 1)) * 1000), 1000)
                        
                        bboxes.append([x1, y1, x2, y2])
                        page_indices.append(page.page_number)
                        block_types.append(block_type_encoding)
                        block_ids.append(block.id)
                        
        return {
            "tokens": tokens,
            "bboxes": bboxes,
            "page_indices": page_indices,
            "block_types": block_types,
            "block_ids": block_ids
        }

    def _mock_layoutlmv3_inference(self, inputs: dict) -> ClassificationResult:
        # Simulate ML processing latency
        time.sleep(0.15)
        
        classes = ["invoice", "resume", "contract", "purchase order", "generic document"]
        predicted_class = random.choice(classes)
        
        # Simulate model logits
        probs = {c: random.uniform(0.01, 0.2) for c in classes}
        probs[predicted_class] = random.uniform(0.85, 0.99)
        
        # Build strict explanation payload
        explanation = {
            "top_tokens": inputs["tokens"][:5] if inputs["tokens"] else [],
            "token_attributions": {t: random.uniform(0.1, 0.9) for t in inputs["tokens"][:5]},
            "layout_attention_summary": {p: random.uniform(0.1, 0.9) for p in set(inputs["page_indices"])},
            "block_importance": {b: random.uniform(0.1, 0.9) for b in set(inputs["block_ids"])},
            "decision_path": ["Extracted 2D layout", "Applied spatial self-attention", f"Highest probability for {predicted_class}"]
        }
        
        return ClassificationResult(
            predicted_class=predicted_class,
            confidence_score=probs[predicted_class],
            class_probabilities=probs,
            model_version=model_registry.active_model_id or "layoutlmv3-v1",
            inference_latency_ms=150.0,
            explanation=explanation,
            fallback_used=False
        )

    def predict(self, document: CanonicalDocument) -> ClassificationResult:
        start_time = time.time()
        
        # 1. Get active model
        active_model = model_registry.active_model_id or "layoutlmv3-v1"
        
        # 2. Prepare inputs
        inputs = self._prepare_inputs(document)
        
        # 3. Inference with safety wrap
        try:
            # We mock the ML inference here for architecture
            # To simulate a real failure randomly or based on doc size:
            if len(inputs["tokens"]) > 5000:
                raise TimeoutError("Model inference timeout due to excessive sequence length")
                
            result = self._mock_layoutlmv3_inference(inputs)
            
            # Record success
            model_registry.record_success(active_model)
            
            result.inference_latency_ms = (time.time() - start_time) * 1000
            return result
            
        except Exception as e:
            # 1. Log failure
            logger.error(f"ML Classification Failed: {active_model} | Error: {str(e)} | Document ID: {document.metadata.get('document_id') if document.metadata else 'Unknown'}")
            
            # 2. Mark model_health_score decrease in registry
            model_registry.record_failure(active_model)
            
            # 3. Fallback to Heuristic
            fallback_result = self.fallback_classifier.predict(document)
            
            # 4. Add flag in result
            fallback_result.fallback_used = True
            
            # Total latency includes failed attempt
            fallback_result.inference_latency_ms = (time.time() - start_time) * 1000
            return fallback_result
