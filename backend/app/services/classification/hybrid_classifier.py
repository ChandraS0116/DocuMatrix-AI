from collections import Counter
from app.models.canonical import CanonicalDocument
from app.services.classification.classifier import DocumentClassifier, ClassificationResult
import time

class HybridHeuristicClassifier(DocumentClassifier):
    def __init__(self):
        self.version = "v1.0-hybrid"
        self.classes = [
            "invoice", "resume", "contract", "purchase order", 
            "bank statement", "medical record", "tax form", "id card", "generic document"
        ]

    def _extract_all_text(self, document: CanonicalDocument) -> str:
        text = ""
        for page in document.pages:
            for block in page.blocks:
                text += block.text.lower() + " "
        return text

    def _compute_layout_signals(self, document: CanonicalDocument) -> dict:
        total_blocks = 0
        header_blocks = 0
        table_like_blocks = 0
        
        for page in document.pages:
            total_blocks += len(page.blocks)
            for block in page.blocks:
                if block.bounding_box.y1 < (page.height * 0.2):
                    header_blocks += 1
                if len(block.words) > 5 and (block.bounding_box.y2 - block.bounding_box.y1) < 50:
                    table_like_blocks += 1
                    
        return {
            "page_count": len(document.pages),
            "text_block_count": total_blocks,
            "header_density": header_blocks / max(total_blocks, 1),
            "table_count": table_like_blocks,
        }

    def _compute_text_signals(self, text: str) -> dict:
        words = text.split()
        freq = Counter(words)
        
        return {
            "invoice_keywords": freq.get("invoice", 0) + freq.get("total", 0) + freq.get("tax", 0),
            "resume_keywords": freq.get("experience", 0) + freq.get("education", 0) + freq.get("skills", 0),
            "contract_keywords": freq.get("agreement", 0) + freq.get("parties", 0) + freq.get("witness", 0),
            "total_tokens": len(words)
        }

    def predict(self, document: CanonicalDocument) -> ClassificationResult:
        start_time = time.time()
        text = self._extract_all_text(document)
        layout_signals = self._compute_layout_signals(document)
        text_signals = self._compute_text_signals(text)
        
        scores = {c: 0.0 for c in self.classes}
        
        if "invoice" in text[:500]:
            scores["invoice"] += 0.4
            
        if text_signals["invoice_keywords"] > 2:
            scores["invoice"] += 0.4
            
        if text_signals["resume_keywords"] > 2:
            scores["resume"] += 0.6
            
        if text_signals["contract_keywords"] > 2:
            scores["contract"] += 0.6
            
        if layout_signals["table_count"] > 1:
            scores["invoice"] += 0.1
            scores["bank statement"] += 0.2
            
        if layout_signals["page_count"] > 3:
            scores["contract"] += 0.2
            scores["resume"] -= 0.2
            
        best_class = "generic document"
        max_score = 0.0
        
        for cls, score in scores.items():
            if score > max_score:
                max_score = score
                best_class = cls
                
        confidence = min(max_score, 0.99)
        if max_score == 0:
            confidence = 0.1
            
        probs = {c: min(scores[c], 0.99) for c in self.classes}
        
        explanation = {
            "top_tokens": ["invoice", "total"] if best_class == "invoice" else [],
            "token_attributions": {},
            "layout_attention_summary": {},
            "block_importance": {},
            "decision_path": [f"Heuristic rules matched for {best_class}"]
        }
            
        latency = (time.time() - start_time) * 1000
        
        return ClassificationResult(
            predicted_class=best_class,
            confidence_score=confidence,
            class_probabilities=probs,
            model_version=self.version,
            inference_latency_ms=latency,
            explanation=explanation,
            fallback_used=True
        )
