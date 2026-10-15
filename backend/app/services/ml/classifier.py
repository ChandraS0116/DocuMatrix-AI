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
        self._load_model()

    def _load_model(self):
        if not AutoTokenizer or not AutoModelForSequenceClassification:
            logger.warning("Transformers not installed. Running in mock mode.")
            return

        if self.device == "cuda":
            self.model_name = self.default_model_name 
        else:
            self.model_name = self.default_model_name

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Loaded classification model {self.model_name} on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load classification model: {e}")

    def classify(self, text: str) -> dict:
        fallback = {"label": "unknown", "confidence": 0.0, "logits": [], "probabilities": [], "model_used": "fallback"}
        
        if not self.model or not self.tokenizer:
            return fallback

        try:
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)
                confidence, predicted_class = torch.max(probs, dim=-1)
                
            return {
                "label": self.model.config.id2label.get(predicted_class.item(), f"class_{predicted_class.item()}"),
                "confidence": confidence.item(),
                "logits": logits.cpu().numpy().tolist()[0],
                "probabilities": probs.cpu().numpy().tolist()[0],
                "model_used": self.model_name
            }
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return fallback

classifier = MLClassifier()
