import os
import io
import math
import logging
from typing import Dict, Any, List, Tuple
import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from sklearn.cluster import MiniBatchKMeans
except ImportError:
    MiniBatchKMeans = None

logger = logging.getLogger(__name__)

# Standard color palette references for natural naming
COLOR_PALETTE = [
    ("Deep Black", (20, 20, 20)),
    ("Charcoal Gray", (65, 65, 65)),
    ("Slate Gray", (112, 128, 144)),
    ("Crisp White", (245, 245, 245)),
    ("Navy Blue", (20, 35, 75)),
    ("Royal Blue", (41, 105, 176)),
    ("Sky Blue", (135, 206, 235)),
    ("Teal / Cyan", (0, 128, 128)),
    ("Forest Green", (34, 100, 34)),
    ("Emerald Green", (46, 139, 87)),
    ("Olive Green", (107, 142, 35)),
    ("Crimson Red", (180, 30, 40)),
    ("Burgundy / Wine", (100, 20, 40)),
    ("Rose Pink", (220, 110, 140)),
    ("Golden Yellow", (220, 180, 40)),
    ("Amber / Orange", (230, 120, 30)),
    ("Earthy Brown", (105, 60, 35)),
    ("Warm Beige / Khaki", (210, 190, 150)),
    ("Plum / Purple", (110, 45, 120))
]

def get_color_name(rgb: Tuple[int, int, int]) -> str:
    """Finds closest descriptive color name by Euclidean distance in RGB space."""
    r, g, b = rgb
    best_name = "Neutral Tone"
    min_dist = float("inf")
    for name, ref_rgb in COLOR_PALETTE:
        dr = r - ref_rgb[0]
        dg = g - ref_rgb[1]
        db = b - ref_rgb[2]
        dist = dr * dr + dg * dg + db * db
        if dist < min_dist:
            min_dist = dist
            best_name = name
    return best_name

class VisionIntelligenceAnalyzer:
    def __init__(self):
        self.face_cascade = None
        self.profile_cascade = None
        self.smile_cascade = None
        self.eye_cascade = None
        self._init_cascades()

    def _init_cascades(self):
        if not cv2:
            return
        try:
            h_path = cv2.data.haarcascades
            self.face_cascade = cv2.CascadeClassifier(h_path + 'haarcascade_frontalface_default.xml')
            self.profile_cascade = cv2.CascadeClassifier(h_path + 'haarcascade_profileface.xml')
            self.smile_cascade = cv2.CascadeClassifier(h_path + 'haarcascade_smile.xml')
            self.eye_cascade = cv2.CascadeClassifier(h_path + 'haarcascade_eye.xml')
        except Exception as e:
            logger.warning(f"Failed to load OpenCV cascades: {e}")

    def _extract_dominant_colors(self, img_rgb: np.ndarray, n_colors: int = 3) -> List[Dict[str, Any]]:
        """Extracts dominant color names and hex values from image region."""
        if img_rgb.size == 0:
            return [{"name": "Undetermined", "hex": "#000000", "percentage": 100}]

        h, w = img_rgb.shape[:2]
        target_size = 80
        small = cv2.resize(img_rgb, (target_size, target_size), interpolation=cv2.INTER_AREA)
        pixels = small.reshape(-1, 3)

        if MiniBatchKMeans:
            try:
                kmeans = MiniBatchKMeans(n_clusters=n_colors, random_state=42, n_init=3)
                kmeans.fit(pixels)
                labels = kmeans.labels_
                centers = kmeans.cluster_centers_

                counts = np.bincount(labels, minlength=n_colors)
                total = len(labels)
                results = []
                for idx in np.argsort(-counts):
                    rgb = tuple(int(round(c)) for c in centers[idx])
                    rgb_clamped = (max(0, min(255, rgb[0])), max(0, min(255, rgb[1])), max(0, min(255, rgb[2])))
                    hex_val = f"#{rgb_clamped[0]:02X}{rgb_clamped[1]:02X}{rgb_clamped[2]:02X}"
                    results.append({
                        "name": get_color_name(rgb_clamped),
                        "hex": hex_val,
                        "percentage": round((counts[idx] / total) * 100, 1)
                    })
                return results
            except Exception:
                pass

        # Fallback mean color
        mean_rgb = tuple(int(round(c)) for c in np.mean(pixels, axis=0))
        hex_val = f"#{mean_rgb[0]:02X}{mean_rgb[1]:02X}{mean_rgb[2]:02X}"
        return [{"name": get_color_name(mean_rgb), "hex": hex_val, "percentage": 100.0}]

    def analyze_image(self, image_bytes: bytes, filename: str = "", ocr_text: str = None) -> Dict[str, Any]:
        """
        Comprehensive Visual Analysis:
        - Human Person Photos: Facial features, eyes, smile, lighting, clothing colors & attire style.
        - Group Photos: Person count, individual descriptions, spatial arrangement.
        - Document/Card Scans: Detects identity cards, invoices, receipts, and credential graphics without false scenery labels.
        - Scenery & Landscape: Environment categorization (sky, greenery, sunset, urban), lighting, color palette.
        """
        if not image_bytes:
            return {"error": "Empty image payload"}

        # Decode image
        img_bgr = None
        if cv2:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            try:
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                return {"error": f"Failed to decode image: {e}"}

        img_h, img_w = img_bgr.shape[:2]
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Detect Faces
        faces = []
        if self.face_cascade and not self.face_cascade.empty():
            scale_factor = 1.15
            min_neighbors = 4
            min_size = (int(img_w * 0.08), int(img_h * 0.08))
            detected = self.face_cascade.detectMultiScale(gray, scaleFactor=scale_factor, minNeighbors=min_neighbors, minSize=min_size)
            if len(detected) > 0:
                faces = list(detected)
            elif self.profile_cascade and not self.profile_cascade.empty():
                prof = self.profile_cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=4, minSize=min_size)
                if len(prof) > 0:
                    faces = list(prof)

        # Sort faces horizontally from left to right
        faces.sort(key=lambda f: f[0])

        total_faces = len(faces)

        # Scene Metrics
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_sharp = laplacian_var > 80.0

        # CASE 1: SINGLE PERSON PHOTO
        if total_faces == 1:
            fx, fy, fw, fh = faces[0]
            face_roi_gray = gray[fy:fy+fh, fx:fx+fw]
            face_roi_rgb = img_rgb[fy:fy+fh, fx:fx+fw]

            # Smile detection (lower half of face)
            is_smiling = False
            smile_confidence = "Neutral / Composed"
            if self.smile_cascade and not self.smile_cascade.empty():
                lower_face = face_roi_gray[int(fh * 0.5):fh, :]
                smiles = self.smile_cascade.detectMultiScale(lower_face, scaleFactor=1.6, minNeighbors=18)
                if len(smiles) > 0:
                    is_smiling = True
                    smile_confidence = "Smiling / Warm and pleasant expression"

            # Eye detection
            eyes_detected = False
            eye_desc = "Eyes visible, directed forward"
            if self.eye_cascade and not self.eye_cascade.empty():
                upper_face = face_roi_gray[0:int(fh * 0.6), :]
                eyes = self.eye_cascade.detectMultiScale(upper_face, scaleFactor=1.15, minNeighbors=3)
                if len(eyes) >= 2:
                    eyes_detected = True
                    eye_desc = "Both eyes clearly defined, direct gaze at camera"
                elif len(eyes) == 1:
                    eye_desc = "Eyes visible, focused orientation"

            # Face Position
            center_x = (fx + fw / 2) / img_w
            if center_x < 0.4:
                pos_str = "Left-aligned portrait orientation"
            elif center_x > 0.6:
                pos_str = "Right-aligned portrait orientation"
            else:
                pos_str = "Centered frontal portrait orientation"

            # Clothing / Upper Torso Region below face
            torso_y1 = fy + fh
            torso_y2 = min(img_h, fy + int(fh * 2.4))
            torso_x1 = max(0, fx - int(fw * 0.4))
            torso_x2 = min(img_w, fx + int(fw * 1.4))

            clothing_colors = []
            primary_attire_color = "Neutral Attire"
            if torso_y2 > torso_y1 and torso_x2 > torso_x1:
                torso_roi = img_rgb[torso_y1:torso_y2, torso_x1:torso_x2]
                clothing_colors = self._extract_dominant_colors(torso_roi, n_colors=3)
                if clothing_colors:
                    primary_attire_color = clothing_colors[0]["name"]

            # Background Color / Setting
            # Sample corners (avoiding face center)
            corner_sample = np.vstack([
                img_rgb[0:int(img_h*0.2), 0:int(img_w*0.2)].reshape(-1, 3),
                img_rgb[0:int(img_h*0.2), int(img_w*0.8):img_w].reshape(-1, 3)
            ])
            bg_colors = self._extract_dominant_colors(corner_sample.reshape(-1, 1, 3), n_colors=2)
            bg_desc = bg_colors[0]["name"] if bg_colors else "Neutral"

            lighting_desc = "Balanced studio illumination" if brightness > 120 else "Atmospheric, soft lighting"

            expr_str = smile_confidence.lower() if "expression" in smile_confidence.lower() else f"{smile_confidence.lower()} expression"
            narrative = (
                f"Single person portrait photograph. The subject is in a {pos_str.lower()} "
                f"exhibiting a {expr_str}. {eye_desc}. "
                f"The individual is wearing {primary_attire_color.lower()} attire against a {bg_desc.lower()} backdrop "
                f"with {lighting_desc.lower()}."
            )

            return {
                "photo_category": "Individual Portrait / Person Photo",
                "person_count": 1,
                "facial_features": {
                    "expression": smile_confidence,
                    "eye_gaze": eye_desc,
                    "face_orientation": pos_str,
                    "lighting_quality": lighting_desc
                },
                "clothing_and_attire": {
                    "primary_color": primary_attire_color,
                    "dominant_palette": clothing_colors,
                    "attire_style": "Business / Formal wear" if any(c in primary_attire_color.lower() for c in ["navy", "black", "white", "charcoal"]) else "Casual wear"
                },
                "background_setting": {
                    "primary_tone": bg_desc,
                    "backdrop_colors": bg_colors
                },
                "visual_summary": narrative
            }

        # CASE 2: GROUP PHOTO (2+ People)
        elif total_faces > 1:
            individuals = []
            for idx, (fx, fy, fw, fh) in enumerate(faces):
                pos_rel = (fx + fw / 2) / img_w
                pos_label = "Left" if pos_rel < 0.35 else ("Right" if pos_rel > 0.65 else "Center")
                
                # Check smile for individual
                is_indiv_smile = False
                if self.smile_cascade and not self.smile_cascade.empty():
                    lower_face = gray[fy + int(fh*0.5):fy+fh, fx:fx+fw]
                    if len(self.smile_cascade.detectMultiScale(lower_face, scaleFactor=1.6, minNeighbors=15)) > 0:
                        is_indiv_smile = True

                # Sample clothing for individual
                ty1 = fy + fh
                ty2 = min(img_h, fy + int(fh * 2.0))
                tx1 = max(0, fx - int(fw * 0.2))
                tx2 = min(img_w, fx + int(fw * 1.2))
                indiv_attire = "Neutral Tone"
                if ty2 > ty1 and tx2 > tx1:
                    c_list = self._extract_dominant_colors(img_rgb[ty1:ty2, tx1:tx2], n_colors=1)
                    if c_list:
                        indiv_attire = c_list[0]["name"]

                individuals.append({
                    "individual": f"Person {idx + 1} ({pos_label})",
                    "position": pos_label,
                    "expression": "Smiling / Engaged" if is_indiv_smile else "Composed / Attentive",
                    "clothing_color": indiv_attire
                })

            summary_text = (
                f"Group portrait capturing {total_faces} individuals gathered together. "
                f"The subjects are arranged across the frame in a coordinated setting. "
                + "; ".join(f"{ind['individual']}: {ind['expression']}, wearing {ind['clothing_color']}" for ind in individuals[:4])
                + (f" and {total_faces - 4} other participants." if total_faces > 4 else ".")
            )

            return {
                "photo_category": "Group Portrait / Team Gathering",
                "person_count": total_faces,
                "group_arrangement": "Horizontal group assembly across frame",
                "individuals": individuals,
                "visual_summary": summary_text
            }

        # CASE 3: SCANNED DOCUMENT / ID CARD OR SCENERY / LANDSCAPE
        else:
            # Check if this image has textual or credential card characteristics
            doc_keywords = ["aadhaar", "idcard", "pan", "national id", "identity", "government", "invoice", "receipt", "bill", "tax", "passport", "license", "certificate", "agreement", "republic of india", "dob", "holder", "date", "total", "amount", "name", "uidai", "padhaar"]
            has_doc_text = False
            if ocr_text:
                text_lower = ocr_text.lower()
                if any(kw in text_lower for kw in doc_keywords) or len(ocr_text.split()) >= 4:
                    has_doc_text = True
            if any(kw in filename.lower() for kw in ["aadhar", "aadhaar", "pan", "invoice", "receipt", "id", "card", "doc", "bill", "scan"]):
                has_doc_text = True

            if has_doc_text:
                is_id = any(k in (ocr_text or "").lower() or k in filename.lower() for k in ["id", "aadhaar", "aadhar", "pan", "card", "national", "passport", "license"])
                doc_type_label = "Identity Credential Card / Scanned ID" if is_id else "Scanned Document / Graphic Asset"
                palette = self._extract_dominant_colors(img_rgb, n_colors=3)
                summary_text = (
                    f"Scanned {doc_type_label.lower()} with structured typographical layout. "
                    f"The document features high-contrast legibility against a {palette[0]['name'].lower()} background."
                )
                return {
                    "photo_category": "Scanned Document / Identity Card" if is_id else "Scanned Document / Graphic",
                    "scene_classification": doc_type_label,
                    "document_layout": "Structured identity / document card format with legible credential text",
                    "environment_description": "Clean document substrate with high-contrast printed text matter.",
                    "lighting_and_atmosphere": "Evenly lit document scan / photographic capture",
                    "color_palette": palette,
                    "visual_summary": summary_text
                }

            # Otherwise, analyze natural / architectural scenery
            # Analyze color distribution in HSV
            hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            h_channel = hsv[:, :, 0]
            s_channel = hsv[:, :, 1]
            v_channel = hsv[:, :, 2]

            # Hue bins (OpenCV Hue ranges from 0 to 180)
            green_mask = (h_channel >= 35) & (h_channel <= 85) & (s_channel > 30)
            blue_mask = (h_channel >= 90) & (h_channel <= 135) & (s_channel > 30)
            warm_mask = ((h_channel <= 25) | (h_channel >= 165)) & (s_channel > 60)
            neutral_mask = (s_channel <= 35)

            green_ratio = np.sum(green_mask) / hsv.size
            blue_ratio = np.sum(blue_mask) / hsv.size
            warm_ratio = np.sum(warm_mask) / hsv.size
            neutral_ratio = np.sum(neutral_mask) / hsv.size

            dominant_palette = self._extract_dominant_colors(img_rgb, n_colors=4)

            # Categorize environment
            if warm_ratio > 0.20 and brightness > 100:
                scene_type = "Sunset / Golden Hour / Warm Horizon"
                setting_desc = "Vibrant warm sunset lighting with rich golden, amber, and reddish atmospheric hues."
            elif blue_ratio > 0.25 and green_ratio > 0.15:
                scene_type = "Coastal / Mountain & Waterscape Nature"
                setting_desc = "Expansive natural landscape combining blue sky or open water with lush vegetation and terrain."
            elif green_ratio > 0.20:
                scene_type = "Lush Nature & Greenery / Forest Landscape"
                setting_desc = "Natural environmental landscape dominated by rich green foliage, trees, and organic vegetation."
            elif blue_ratio > 0.30:
                scene_type = "Open Sky / Marine Waterscape"
                setting_desc = "Open-air scenic environment showcasing expansive sky and clear water features."
            elif neutral_ratio > 0.45:
                scene_type = "Architectural / Urban Environment / Structured Interior"
                setting_desc = "Structured scene showcasing architectural lines, urban geometry, or modern interior design."
            else:
                scene_type = "Natural Environmental Scenery"
                setting_desc = "Ambient environmental composition with balanced natural lighting and balanced color palette."

            lighting_atmosphere = "Bright daytime daylight" if brightness > 140 else ("Soft golden hour glow" if warm_ratio > 0.15 else "Soft diffused natural lighting")

            summary_text = (
                f"Scenery photograph depicting a {scene_type.lower()}. {setting_desc} "
                f"The scene features {lighting_atmosphere.lower()} with dominant tones of "
                + ", ".join(f"{c['name']} ({c['percentage']}%)" for c in dominant_palette[:3]) + "."
            )

            return {
                "photo_category": "Landscape / Scenery / Environmental Photo",
                "scene_classification": scene_type,
                "environment_description": setting_desc,
                "lighting_and_atmosphere": lighting_atmosphere,
                "color_palette": dominant_palette,
                "visual_summary": summary_text
            }

    def analyze_pdf_embedded_images(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts and analyzes embedded images within PDF documents."""
        results = []
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page_idx, page in enumerate(reader.pages):
                for img_idx, img_obj in enumerate(getattr(page, 'images', [])):
                    try:
                        raw_data = img_obj.data
                        if len(raw_data) > 500: # Ignore tiny 1px spacer artifacts
                            analysis = self.analyze_image(raw_data, filename=f"page_{page_idx+1}_img_{img_idx+1}")
                            analysis["source_page"] = page_idx + 1
                            analysis["image_index"] = img_idx + 1
                            results.append(analysis)
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"PDF embedded image extraction notice: {e}")

        return results

vision_analyzer = VisionIntelligenceAnalyzer()
