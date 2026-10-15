import os
import logging
from typing import Dict, Any
import numpy as np

try:
    import cv2
    import pytesseract
except ImportError:
    cv2 = None
    pytesseract = None

try:
    import boto3
except ImportError:
    boto3 = None

logger = logging.getLogger(__name__)

class OCRProvider:
    def extract(self, image_bytes: bytes, config: dict) -> dict:
        raise NotImplementedError

class TesseractOCRProvider(OCRProvider):
    def extract(self, image_bytes: bytes, config: dict) -> dict:
        if cv2 is None or pytesseract is None:
            raise RuntimeError("cv2 or pytesseract not installed")

        if os.name == 'nt':
            tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            if os.path.exists(tesseract_path):
                pytesseract.pytesseract.tesseract_cmd = tesseract_path

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Corrupted image data")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        denoised = cv2.medianBlur(thresh, 3)
        
        text = pytesseract.image_to_string(denoised)
        data = pytesseract.image_to_data(denoised, output_type=pytesseract.Output.DICT)
        
        confidences = [int(c) for c in data['conf'] if str(c).isdigit() and int(c) != -1]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        blocks = []
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > -1 and data['text'][i].strip():
                blocks.append({
                    "text": data['text'][i],
                    "bbox": [data['left'][i], data['top'][i], data['width'][i], data['height'][i]],
                    "confidence": int(data['conf'][i])
                })

        return {
            "raw_text": text,
            "confidence_score": avg_confidence,
            "bounding_boxes": blocks,
            "source": "tesseract"
        }

class TextractOCRProvider(OCRProvider):
    def __init__(self):
        self.enabled = False
        self.client = None
        if boto3:
            try:
                region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
                self.client = boto3.client('textract', region_name=region)
                self.enabled = True
            except Exception as e:
                logger.warning(f"TextractOCRProvider disabled: {e}")

    def extract(self, image_bytes: bytes, config: dict) -> dict:
        if not self.enabled or not self.client:
            raise RuntimeError("Textract is not enabled or boto3 not installed")
            
        response = self.client.detect_document_text(Document={'Bytes': image_bytes})
        blocks = response.get('Blocks', [])
        
        lines = [b for b in blocks if b['BlockType'] == 'LINE']
        text = " ".join([b.get('Text', '') for b in lines])
        confidence = sum([b.get('Confidence', 0) for b in lines]) / max(1, len(lines))
        
        return {
            "raw_text": text,
            "confidence_score": confidence,
            "bounding_boxes": blocks,
            "source": "textract"
        }

class OCRRouter:
    def __init__(self):
        self.tesseract = TesseractOCRProvider()
        self.textract = TextractOCRProvider()

    def process(self, image_bytes: bytes, image_quality_score: float = 1.0) -> dict:
        fallback = {"raw_text": "", "confidence_score": 0.0, "bounding_boxes": [], "source": "fallback"}
        
        try:
            if image_quality_score < 0.6:
                return self.textract.extract(image_bytes, {})
            else:
                return self.tesseract.extract(image_bytes, {})
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return fallback
            
ocr_router = OCRRouter()
