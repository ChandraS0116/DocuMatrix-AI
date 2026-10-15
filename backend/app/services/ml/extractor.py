import os
import re
import logging

try:
    import transformers
    from transformers import pipeline
    transformers.logging.set_verbosity_error()
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
except ImportError:
    transformers = None
    pipeline = None

logger = logging.getLogger(__name__)

class HybridExtractor:
    def __init__(self):
        self.ner_pipeline = None
        self._load_lightweight_ner()

    def _load_lightweight_ner(self):
        if not pipeline:
            logger.warning("Transformers not installed. Skipping NER fallback.")
            return
            
        try:
            # Very lightweight standard NER model (much smaller than LayoutLM)
            self.ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple", device="cpu")
            logger.info("Loaded lightweight NER pipeline for fallback extraction.")
        except Exception as e:
            logger.warning(f"Failed to load lightweight NER: {e}")

    def extract(self, image, words: list, boxes: list) -> dict:
        # Hybrid Approach:
        # 1. Regex over OCR text
        # 2. Template matching (basic)
        # 3. NER fallback if Regex misses
        
        full_text = " ".join(words)
        
        entities = {}
        
        # 1. REGEX EXTRACTION
        
        # Invoice Number (INV-XXXX or similar)
        inv_match = re.search(r'(?:INV|Invoice|#)[\s:-]*([A-Z0-9-]+)', full_text, re.IGNORECASE)
        if inv_match:
            entities["invoice_number"] = inv_match.group(1).strip()
            
        # Amount ($XXXX.XX or similar)
        amt_match = re.search(r'(?:Total|Amount|Due|Balance)[\s:-]*\$?([0-9,]+\.[0-9]{2})', full_text, re.IGNORECASE)
        if amt_match:
            entities["total_amount"] = amt_match.group(1).strip()
            
        # Date (YYYY-MM-DD or MM/DD/YYYY)
        date_match = re.search(r'([0-9]{2,4}[-/][0-9]{2}[-/][0-9]{2,4})', full_text)
        if date_match:
            entities["date"] = date_match.group(1).strip()
            
        # 2. NER EXTRACTION (Vendor / Customer names)
        if self.ner_pipeline and ("vendor_name" not in entities or "customer_name" not in entities):
            try:
                ner_results = self.ner_pipeline(full_text[:512]) # limit to first 512 chars for speed
                orgs = [res['word'] for res in ner_results if res['entity_group'] == 'ORG']
                persons = [res['word'] for res in ner_results if res['entity_group'] == 'PER']
                
                if orgs and "vendor_name" not in entities:
                    entities["vendor_name"] = orgs[0]
                if len(orgs) > 1 and "customer_name" not in entities:
                    entities["customer_name"] = orgs[1]
                elif persons and "customer_name" not in entities:
                    entities["customer_name"] = persons[0]
            except Exception as e:
                logger.warning(f"NER extraction failed: {e}")
                
        # Format output to match expected schema
        # The frontend/backend expects structured_json to contain key-value pairs of extracted fields
        formatted_entities = [{"field": k, "value": v, "confidence": 0.85, "source": "hybrid"} for k, v in entities.items()]
        
        return {
            "entities": formatted_entities, # Used by caller to count entities
            "fields": entities,             # Direct key-value access
            "confidence": 0.85,
            "method": "hybrid"
        }

extractor = HybridExtractor()
