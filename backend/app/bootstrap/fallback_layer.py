class FallbackLayer:

    @staticmethod
    def ocr_fallback():
        return {"text": "OCR_UNAVAILABLE", "confidence": 0.0}

    @staticmethod
    def ml_fallback():
        return {"class": "unknown", "confidence": 0.0}

    @staticmethod
    def elastic_fallback():
        return []
