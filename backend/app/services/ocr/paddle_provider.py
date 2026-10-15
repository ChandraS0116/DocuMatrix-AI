import time
import io
import uuid
from typing import Tuple
from pdf2image import convert_from_bytes
from paddleocr import PaddleOCR
from PIL import Image
import numpy as np

from app.models.canonical import CanonicalDocument, Page, Block, Word, BoundingBox
from app.services.ocr.provider import OCRProvider

class PaddleOCRProvider(OCRProvider):
    def __init__(self):
        # Initialize PaddleOCR model
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
        self.version = "paddleocr_2.7.0.3"

    def _convert_bbox(self, paddle_bbox: list) -> BoundingBox:
        # PaddleOCR bbox: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
        xs = [pt[0] for pt in paddle_bbox]
        ys = [pt[1] for pt in paddle_bbox]
        return BoundingBox(x1=min(xs), y1=min(ys), x2=max(xs), y2=max(ys))

    def _process_image(self, image_array: np.ndarray, page_number: int, doc_id: str) -> Tuple[Page, list]:
        result = self.ocr.ocr(image_array, cls=True)
        
        blocks = []
        raw_page_data = []
        reading_order = 0
        
        page_results = result[0] if result and result[0] else []
        height, width = image_array.shape[:2]
        
        for line in page_results:
            bbox, (text, confidence) = line
            canonical_bbox = self._convert_bbox(bbox)
            
            word = Word(
                text=text,
                bounding_box=canonical_bbox,
                confidence=confidence,
                reading_order=reading_order
            )
            
            block = Block(
                block_id=str(uuid.uuid4()),
                block_type="paragraph",
                bounding_box=canonical_bbox,
                text=text,
                reading_order=reading_order,
                words=[word]
            )
            
            blocks.append(block)
            raw_page_data.append(line)
            reading_order += 1
            
        page = Page(
            page_number=page_number,
            width=float(width),
            height=float(height),
            blocks=blocks
        )
        
        return page, raw_page_data

    def extract_document(self, file_stream: bytes, mime_type: str, document_id: str) -> Tuple[CanonicalDocument, dict, dict]:
        start_time = time.time()
        pages = []
        raw_response = {}
        
        try:
            if mime_type == 'application/pdf':
                images = convert_from_bytes(file_stream)
                for idx, img in enumerate(images):
                    img_array = np.array(img)
                    page, raw_data = self._process_image(img_array, idx + 1, document_id)
                    pages.append(page)
                    raw_response[f"page_{idx+1}"] = raw_data
            else:
                # Assume Image
                img = Image.open(io.BytesIO(file_stream)).convert('RGB')
                img_array = np.array(img)
                page, raw_data = self._process_image(img_array, 1, document_id)
                pages.append(page)
                raw_response["page_1"] = raw_data
                
        except Exception as e:
            raise Exception(f"OCR Processing Error: {str(e)}")

        duration_ms = int((time.time() - start_time) * 1000)
        
        canonical_doc = CanonicalDocument(
            document_id=document_id,
            pages=pages
        )
        
        metrics = {
            "processing_duration_ms": duration_ms,
            "page_count": len(pages),
            "ocr_engine_version": self.version
        }
        
        return canonical_doc, raw_response, metrics
