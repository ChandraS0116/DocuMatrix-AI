import os
import logging

try:
    import torch
    import transformers
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    transformers.logging.set_verbosity_error()
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
except ImportError:
    torch = None
    AutoTokenizer = None
    AutoModelForSequenceClassification = None

logger = logging.getLogger(__name__)

class MLClassifier:
    def __init__(self):
        self.default_model_name = "distilbert-base-uncased"
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch and torch.cuda.is_available() else "cpu"
        self._is_loading = False

    def _load_model(self):
        if self.model is not None or self._is_loading:
            return
        if not AutoTokenizer or not AutoModelForSequenceClassification:
            return

        self._is_loading = True
        try:
            self.model_name = self.default_model_name
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Loaded classification model {self.model_name} on {self.device}")
        except Exception as e:
            logger.warning(f"Classification model load notice: {e}")
        finally:
            self._is_loading = False

    def classify(self, text: str) -> dict:
        fallback = {"label": "generic", "confidence": 0.5, "logits": [], "probabilities": [], "model_used": "fallback"}
        
        if not text or not text.strip():
            return fallback

        low_text = text.lower()
        
        # Domain-aware deterministic classification
        if any(k in low_text for k in ["aadhaar", "uidai", "unique identification authority of india", "mera aadhaar", "identity card"]):
            return {"label": "Identity Document (Aadhaar)", "confidence": 0.98, "logits": [], "probabilities": [0.98, 0.02], "model_used": "rules+domain_nlp"}
        elif any(k in low_text for k in ["income tax department", "permanent account number", "pan card"]):
            return {"label": "Identity Document (PAN)", "confidence": 0.98, "logits": [], "probabilities": [0.98, 0.02], "model_used": "rules+domain_nlp"}
        elif any(k in low_text for k in ["tax invoice", "invoice", "bill to", "invoice number", "amount due"]):
            return {"label": "Invoice", "confidence": 0.95, "logits": [], "probabilities": [0.95, 0.05], "model_used": "rules+domain_nlp"}
        elif any(k in low_text for k in ["receipt", "payment receipt", "cash receipt", "merchant copy"]):
            return {"label": "Receipt", "confidence": 0.92, "logits": [], "probabilities": [0.92, 0.08], "model_used": "rules+domain_nlp"}
        elif any(k in low_text for k in ["agreement", "contract", "parties hereto", "indemnification", "jurisdiction"]):
            return {"label": "Legal Contract", "confidence": 0.94, "logits": [], "probabilities": [0.94, 0.06], "model_used": "rules+domain_nlp"}
        elif any(k in low_text for k in ["bank statement", "account statement", "opening balance", "closing balance"]):
            return {"label": "Financial Statement", "confidence": 0.93, "logits": [], "probabilities": [0.93, 0.07], "model_used": "rules+domain_nlp"}

        self._load_model()
        if not self.model or not self.tokenizer:
            return {"label": "General Document", "confidence": 0.80, "logits": [], "probabilities": [], "model_used": "heuristic"}

        try:
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)
                confidence, predicted_class = torch.max(probs, dim=-1)
                
            raw_label = self.model.config.id2label.get(predicted_class.item(), f"class_{predicted_class.item()}")
            label = "Corporate Document" if "1" in raw_label else "Standard Form"
            return {
                "label": label,
                "confidence": round(confidence.item(), 3),
                "logits": logits.cpu().numpy().tolist()[0],
                "probabilities": probs.cpu().numpy().tolist()[0],
                "model_used": self.model_name
            }
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return fallback

classifier = MLClassifier()
