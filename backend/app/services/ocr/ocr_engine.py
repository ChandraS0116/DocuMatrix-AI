import os
import io
import logging
import asyncio
import concurrent.futures
from typing import Dict, Any, List
import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    import boto3
except ImportError:
    boto3 = None

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

try:
    import pypdfium2 as pdfium
    PDFIUM_AVAILABLE = True
except ImportError:
    pdfium = None
    PDFIUM_AVAILABLE = False

try:
    import winocr
    WINOCR_AVAILABLE = True
except ImportError:
    winocr = None
    WINOCR_AVAILABLE = False

logger = logging.getLogger(__name__)

class OCRProvider:
    def extract(self, data: Any, config: dict = None) -> dict:
        raise NotImplementedError

class WindowsMediaOCRProvider(OCRProvider):
    """
    Native Windows Media OCR Provider.
    Zero external binaries required on Windows 10/11.
    Extracts text, lines, words, and bounding boxes with high speed and precision.
    """
    def __init__(self):
        self.available = WINOCR_AVAILABLE

    def _run_async(self, coro):
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(lambda: asyncio.run(coro)).result(timeout=45)

    def extract_from_pil(self, pil_image: Image.Image) -> dict:
        if not self.available:
            raise RuntimeError("winocr is not installed or not supported on this platform")

        # Convert to RGB if needed
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")

        # Windows OCR requires image dimensions <= 4096 and >= 40
        w, h = pil_image.size
        if w > 4000 or h > 4000:
            scale = min(4000 / w, 4000 / h)
            pil_image = pil_image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        elif w < 40 or h < 40:
            pil_image = pil_image.resize((max(40, w * 2), max(40, h * 2)), Image.Resampling.NEAREST)

        res = self._run_async(winocr.recognize_pil(pil_image))

        lines_text = []
        blocks = []
        confidences = []

        for line in getattr(res, 'lines', []):
            line_str = getattr(line, 'text', '').strip()
            if line_str:
                lines_text.append(line_str)
            for word in getattr(line, 'words', []):
                w_text = getattr(word, 'text', '').strip()
                if not w_text:
                    continue
                rect = getattr(word, 'bounding_rect', None)
                if rect:
                    bbox = [int(rect.x), int(rect.y), int(rect.width), int(rect.height)]
                else:
                    bbox = [0, 0, 100, 20]
                blocks.append({
                    "text": w_text,
                    "bbox": bbox,
                    "confidence": 96
                })
                confidences.append(96)

        raw_text = "\n".join(lines_text).strip()
        avg_conf = sum(confidences) / max(1, len(confidences)) if confidences else 90.0

        return {
            "raw_text": raw_text,
            "confidence_score": avg_conf,
            "bounding_boxes": blocks,
            "source": "winocr_native",
            "page_count": 1
        }

    def extract(self, image_bytes: bytes, config: dict = None) -> dict:
        pil_img = Image.open(io.BytesIO(image_bytes))
        return self.extract_from_pil(pil_img)

class TesseractOCRProvider(OCRProvider):
    def extract(self, image_bytes: bytes, config: dict = None) -> dict:
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

    def extract(self, image_bytes: bytes, config: dict = None) -> dict:
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

class PDFTextProvider(OCRProvider):
    """
    Intelligent PDF Extraction:
    1. First reads digital vector text with pypdf.
    2. If text is missing or sparse (< 40 characters), renders pages with pypdfium2
       and performs native Windows OCR on each rendered page.
    """
    def __init__(self, winocr_provider: WindowsMediaOCRProvider):
        self.winocr = winocr_provider

    def extract(self, pdf_bytes: bytes, config: dict = None) -> dict:
        full_text = ""
        blocks = []
        page_count = 1

        # 1. Native digital text extraction
        if PYPDF_AVAILABLE:
            try:
                reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(reader.pages)
                pages_text = []
                y_offset = 0

                for page_idx, page in enumerate(reader.pages):
                    t = page.extract_text() or ""
                    if t.strip():
                        pages_text.append(t)
                        for line_idx, line in enumerate(t.split("\n")):
                            trimmed = line.strip()
                            if trimmed:
                                for word in trimmed.split():
                                    blocks.append({
                                        "text": word,
                                        "bbox": [40, y_offset + line_idx * 20, 100, 18],
                                        "confidence": 98,
                                        "page": page_idx + 1
                                    })
                        y_offset += (len(t.split("\n")) + 1) * 20

                full_text = "\n".join(pages_text).strip()
            except Exception as e:
                logger.warning(f"pypdf extraction notice: {e}")

        # 2. If text is missing/scanned (< 40 chars), render pages with pypdfium2 and run WinOCR
        if len(full_text) < 40 and PDFIUM_AVAILABLE and self.winocr.available:
            try:
                doc = pdfium.PdfDocument(pdf_bytes)
                page_count = len(doc)
                ocr_pages = []
                blocks = []
                
                # Process up to 10 pages for speed
                for p_idx in range(min(page_count, 10)):
                    page = doc[p_idx]
                    page_img = page.render(scale=2.0).to_pil()
                    page_res = self.winocr.extract_from_pil(page_img)
                    if page_res.get("raw_text"):
                        ocr_pages.append(page_res["raw_text"])
                        for b in page_res.get("bounding_boxes", []):
                            b["page"] = p_idx + 1
                            blocks.append(b)

                if ocr_pages:
                    full_text = "\n\n".join(ocr_pages).strip()
                    logger.info(f"Rendered PDF page OCR completed: {len(full_text)} characters extracted")
                    return {
                        "raw_text": full_text,
                        "confidence_score": 95.0,
                        "bounding_boxes": blocks,
                        "source": "pdfium_winocr",
                        "page_count": page_count
                    }
            except Exception as e:
                logger.warning(f"pdfium + winocr failed: {e}")

        # 3. If text is still missing or sparse (< 40 chars), check embedded images using pypdf and run winocr on each image
        if len(full_text) < 40 and PYPDF_AVAILABLE and self.winocr.available:
            try:
                reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                img_texts = []
                for p_idx, page in enumerate(reader.pages):
                    for img_obj in getattr(page, 'images', []):
                        try:
                            pil_im = Image.open(io.BytesIO(img_obj.data))
                            res_im = self.winocr.extract_from_pil(pil_im)
                            if res_im.get("raw_text") and len(res_im["raw_text"].strip()) > 3:
                                img_texts.append(res_im["raw_text"].strip())
                                for b in res_im.get("bounding_boxes", []):
                                    b["page"] = p_idx + 1
                                    blocks.append(b)
                        except Exception:
                            pass
                if img_texts:
                    full_text = "\n\n".join(img_texts).strip()
                    logger.info(f"Embedded image OCR completed: {len(full_text)} characters extracted")
                    return {
                        "raw_text": full_text,
                        "confidence_score": 95.0,
                        "bounding_boxes": blocks,
                        "source": "embedded_image_winocr",
                        "page_count": page_count
                    }
            except Exception as e:
                logger.warning(f"embedded image OCR failed: {e}")

        # If digital text was found, return it
        if full_text:
            return {
                "raw_text": full_text,
                "confidence_score": 97.0,
                "bounding_boxes": blocks,
                "source": "pypdf_native",
                "page_count": page_count
            }

        return {
            "raw_text": full_text,
            "confidence_score": 70.0,
            "bounding_boxes": blocks,
            "source": "pypdf_empty",
            "page_count": page_count
        }

class OCRRouter:
    def __init__(self):
        self.winocr = WindowsMediaOCRProvider()
        self.pdf_provider = PDFTextProvider(self.winocr)
        self.tesseract = TesseractOCRProvider()
        self.textract = TextractOCRProvider()

    def process(self, image_bytes: bytes, image_quality_score: float = 1.0) -> dict:
        fallback = {"raw_text": "", "confidence_score": 0.0, "bounding_boxes": [], "source": "fallback"}
        
        if not image_bytes:
            return fallback

        # 1. Check if payload is a PDF
        if image_bytes.startswith(b"%PDF") or b"%PDF-" in image_bytes[:1024]:
            try:
                result = self.pdf_provider.extract(image_bytes)
                if result:
                    return result
            except Exception as e:
                logger.warning(f"PDF extraction failed: {e}")
            return {"raw_text": "", "confidence_score": 0.0, "bounding_boxes": [], "source": "pdf_empty", "page_count": 1}

        # 2. Try Windows Media OCR (Native on Windows, supports all image formats)
        if self.winocr.available:
            try:
                result = self.winocr.extract(image_bytes)
                if result and result.get("raw_text"):
                    return result
            except Exception as e:
                logger.warning(f"Windows Media OCR failed: {e}")

        # 3. Try Tesseract as fallback
        try:
            return self.tesseract.extract(image_bytes, {})
        except Exception:
            pass

        # 4. Try Textract if enabled
        if self.textract.enabled:
            try:
                return self.textract.extract(image_bytes, {})
            except Exception:
                pass

        return fallback

ocr_router = OCRRouter()
