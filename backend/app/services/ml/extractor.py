import os
import re
import logging
from typing import Dict, Any, List

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
        self._ner_loading = False

    def _get_ner_pipeline(self):
        if self.ner_pipeline is not None:
            return self.ner_pipeline
        if not pipeline or self._ner_loading:
            return None
        self._ner_loading = True
        try:
            self.ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple", device="cpu")
            logger.info("Loaded lightweight NER pipeline for fallback extraction.")
            return self.ner_pipeline
        except Exception as e:
            logger.warning(f"NER pipeline notice: {e}")
            return None
        finally:
            self._ner_loading = False

    def extract(self, image=None, words: list = None, boxes: list = None, raw_text: str = None) -> dict:
        """
        Comprehensive Information Extractor:
        Extracts structured fields from raw OCR text, lines, key-value syntax,
        and named entity patterns across Invoices, Contracts, IDs, Reports, and Images.
        """
        if raw_text:
            full_text = raw_text
        elif words:
            full_text = " ".join(words)
        else:
            full_text = ""

        entities = {}
        lines = [line.strip() for line in full_text.split("\n") if line.strip()]

        # 1. Structured Key: Value line parsing (e.g. "Invoice Number: INV-1004", "Total: $1250", "Party: Acme")
        for line in lines:
            kv_match = re.match(r'^([A-Za-z][A-Za-z0-9\s/_-]{1,32})[:=]\s*(.+)$', line)
            if kv_match:
                raw_k, raw_v = kv_match.group(1).strip(), kv_match.group(2).strip()
                norm_k = re.sub(r'[^a-z0-9]+', '_', raw_k.lower()).strip('_')
                if norm_k and raw_v and len(norm_k) > 1 and len(raw_v) < 120:
                    entities[norm_k] = raw_v

        # 2. Specific Entity Patterns

        # Aadhaar Number (12 digits in 4-4-4, 8-4, 4-8, or continuous 12 digits, or preceded by Aadhaar/UID/National ID)
        aadhaar_found = False
        aadhaar_kw = re.search(r'(?:AADHAAR|UIDAI|UID|ADHAAR|PADHAAR|NATIONAL\s*ID(?:CARD)?)\s*(?:NO|NUMBER|#)?[:\s]*([0-9\s-]{11,18})', full_text, re.IGNORECASE)
        if aadhaar_kw:
            digits = re.sub(r'\D', '', aadhaar_kw.group(1))
            if len(digits) >= 12:
                d12 = digits[:12]
                entities["aadhaar_number"] = f"{d12[:4]} {d12[4:8]} {d12[8:]}"
                aadhaar_found = True

        if not aadhaar_found:
            m = re.search(r'\b(\d{4}[\s-]\d{4}[\s-]\d{4})\b', full_text)
            if m:
                clean_d = re.sub(r'\D', '', m.group(1))
                entities["aadhaar_number"] = f"{clean_d[:4]} {clean_d[4:8]} {clean_d[8:]}"
                aadhaar_found = True
            else:
                m_split = re.search(r'\b(\d{8}[\s-]\d{4}|\d{4}[\s-]\d{8})\b', full_text)
                if m_split:
                    clean_d = re.sub(r'\D', '', m_split.group(1))
                    entities["aadhaar_number"] = f"{clean_d[:4]} {clean_d[4:8]} {clean_d[8:]}"
                    aadhaar_found = True
                else:
                    m12 = re.search(r'\b(\d{12})\b', full_text)
                    if m12:
                        d12 = m12.group(1)
                        entities["aadhaar_number"] = f"{d12[:4]} {d12[4:8]} {d12[8:]}"
                        aadhaar_found = True

        # National / Government Authority Detection
        if re.search(r'(?:GOVERNMENT\s*OF\s*INDIA|GOVERNMENTOF\s*INDIA|REPUBLIC\s*OF\s*INDIA|UIDAI|UNIQUE\s*IDENTIFICATION)', full_text, re.IGNORECASE):
            entities["issuing_authority"] = "Government of India"
            if "aadhaar_number" in entities or any(w in full_text.upper() for w in ["AADHAAR", "PADHAAR", "UIDAI"]):
                entities["document_category"] = "Unique Identification Authority of India (Aadhaar Card)"

        # PAN Card (e.g. ABCDE1234F)
        pan_match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b', full_text)
        if pan_match:
            entities["pan_number"] = pan_match.group(1).strip()
            if "issuing_authority" not in entities:
                entities["issuing_authority"] = "Income Tax Department (Govt of India)"
                entities["document_category"] = "Permanent Account Number (PAN Card)"

        # Holder Name Detection
        if "holder_name" not in entities and "name" not in entities:
            name_m = re.search(r'(?:NAME|Holder(?:\'s)?\s*Name|Full\s*Name|Employee\s*Name)[\s:=]+([A-Za-z\s]{2,35})(?=\n|$|\d)', full_text, re.IGNORECASE)
            if name_m:
                cand_name = name_m.group(1).strip()
                if not any(bw in cand_name.upper() for bw in ["GOVERNMENT", "INDIA", "INVOICE", "TOTAL", "SIGNATURE", "IDCARD", "DATE", "NUMBER"]):
                    entities["holder_name"] = cand_name

        # Date of Birth (DOB) / Year of Birth
        dob_match = re.search(r'(?:DOB|Date\s*of\s*Birth|Birth|D\.O\.B|cog|yob|Year\s*of\s*Birth)[\s:=-]*([0-9]{1,2}[/\-\\.][0-9]{1,2}[/\-\\.][0-9]{2,4}|[0-9]{4})', full_text, re.IGNORECASE)
        if dob_match:
            entities["dob"] = dob_match.group(1).replace('\\', '/').replace('.', '/').strip()

        # Gender
        gender_match = re.search(r'\b(Male|Female|Transgender|MALE|FEMALE)\b', full_text, re.IGNORECASE)
        if gender_match:
            entities["gender"] = gender_match.group(1).capitalize()

        # Invoice / Reference / Order / Receipt Number
        if "invoice_number" not in entities and "aadhaar_number" not in entities and "pan_number" not in entities:
            inv_match = re.search(r'(?:Invoice\s*(?:No|Number|#)?|Inv\s*(?:No|#)?|Bill\s*(?:No|#)?|Receipt\s*(?:No|#)?|Order\s*(?:No|#)?)[\s:-]*([A-Z0-9-]{3,24})', full_text, re.IGNORECASE)
            if inv_match:
                entities["invoice_number"] = inv_match.group(1).strip()

        # Total Amount / Gross Amount
        if "total_amount" not in entities and "aadhaar_number" not in entities:
            amt_match = re.search(r'(?:Total\s*Amount|Grand\s*Total|Total|Amount\s*Due|Balance\s*Due|Net\s*Payable)[\s:-]*[₹\$€£]?\s*([0-9,]+\.[0-9]{2})', full_text, re.IGNORECASE)
            if amt_match:
                entities["total_amount"] = amt_match.group(1).strip()
            else:
                amt_match2 = re.search(r'[₹\$€£]\s*([0-9,]+\.[0-9]{2})', full_text)
                if amt_match2:
                    entities["total_amount"] = amt_match2.group(1).strip()

        # Subtotal
        if "subtotal" not in entities and "aadhaar_number" not in entities:
            sub_match = re.search(r'(?:Subtotal|Sub-Total|Item\s*Total)[\s:-]*[₹\$€£]?\s*([0-9,]+\.[0-9]{2})', full_text, re.IGNORECASE)
            if sub_match:
                entities["subtotal"] = sub_match.group(1).strip()

        # Tax / VAT / GST
        if "tax_amount" not in entities and "tax" not in entities and "aadhaar_number" not in entities:
            tax_match = re.search(r'(?:Tax|GST|VAT|CGST|SGST|IGST)[\s:-]*[₹\$€£]?\s*([0-9,]+\.[0-9]{2})', full_text, re.IGNORECASE)
            if tax_match:
                entities["tax_amount"] = tax_match.group(1).strip()

        # Date
        if "date" not in entities and "invoice_date" not in entities and "dob" not in entities:
            date_match = re.search(r'(?:Date|Dated)[\s:-]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})', full_text, re.IGNORECASE)
            if date_match:
                entities["date"] = date_match.group(1).strip()
            elif "aadhaar_number" not in entities and "pan_number" not in entities:
                d_match = re.search(r'\b([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2}[/-][0-9]{2}[/-][0-9]{4})\b', full_text)
                if d_match:
                    entities["date"] = d_match.group(1).strip()

        # Due Date
        if "due_date" not in entities and "aadhaar_number" not in entities:
            due_match = re.search(r'(?:Due\s*Date|Payment\s*Due)[\s:-]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})', full_text, re.IGNORECASE)
            if due_match:
                entities["due_date"] = due_match.group(1).strip()

        # Vendor / Company Name
        if "vendor_name" not in entities and "vendor" not in entities and "aadhaar_number" not in entities:
            v_match = re.search(r'(?:Vendor|From|Seller|Billed\s*By|Company)[\s:-]*([^\n,]{3,40})', full_text, re.IGNORECASE)
            if v_match:
                entities["vendor_name"] = v_match.group(1).strip()

        # Customer / Client Name
        if "customer_name" not in entities and "bill_to" not in entities and "aadhaar_number" not in entities:
            c_match = re.search(r'(?:Bill\s*To|Customer|Client|To|Recipient)[\s:-]*([^\n,]{3,40})', full_text, re.IGNORECASE)
            if c_match:
                entities["customer_name"] = c_match.group(1).strip()

        # Contract specific
        if any(w in full_text.lower() for w in ["agreement", "contract", "parties", "indemnification"]):
            if "contract_title" not in entities:
                for line in lines[:3]:
                    if any(term in line.lower() for term in ["agreement", "contract", "terms", "sla"]):
                        entities["contract_title"] = line
                        break
            if "party_a" not in entities:
                pa_match = re.search(r'(?:between|party\s*a|carrier|contractor)[\s:-]*([A-Za-z0-9\s,]{3,35})(?:and|party\s*b|\n)', full_text, re.IGNORECASE)
                if pa_match:
                    entities["party_a"] = pa_match.group(1).strip()

        # Email & Phone
        if "email" not in entities:
            email_match = re.search(r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b', full_text)
            if email_match:
                entities["email"] = email_match.group(1).strip()

        if "phone" not in entities:
            phone_match = re.search(r'(?:Phone|Tel|Mobile|Cell)[\s:-]*([+]?[0-9\s-]{10,16})', full_text, re.IGNORECASE)
            if phone_match:
                entities["phone"] = phone_match.group(1).strip()

        # 3. NER Extraction if Vendor/Customer still missing (only for business/invoice documents, NOT ID cards)
        if "aadhaar_number" not in entities and "pan_number" not in entities:
            ner_pipe = self._get_ner_pipeline() if ("vendor_name" not in entities or "customer_name" not in entities) else None
            if ner_pipe:
                try:
                    ner_results = ner_pipe(full_text[:512])
                    orgs = [res['word'] for res in ner_results if res.get('entity_group') == 'ORG']
                    persons = [res['word'] for res in ner_results if res.get('entity_group') == 'PER']
                    
                    if orgs and "vendor_name" not in entities:
                        entities["vendor_name"] = orgs[0]
                    if len(orgs) > 1 and "customer_name" not in entities:
                        entities["customer_name"] = orgs[1]
                    elif persons and "customer_name" not in entities:
                        entities["customer_name"] = persons[0]
                except Exception as e:
                    logger.warning(f"NER extraction notice: {e}")

        # Strict Blacklist Filter for Bogus NER / Split text
        BOGUS_VALUES = {
            "GO", "F INDIA", "INDIA", "GOVERNMENT", "GOVERNMENTOF INDIA", "GOVERNMENT OF INDIA",
            "NATIONAL IDCARD", "IDCARD", "TAX INVOICE", "INVOICE", "DUPLICATE", "ORIGINAL", "TOTAL",
            "AMOUNT", "SIGNATURE", "AUTHORIZED SIGNATORY", "PAGE", "SUBTOTAL", "GST", "VAT", "DATE",
            "REPUBLIC OF INDIA", "UIDAI", "AADHAAR", "PADHAAR", "NATIONAL"
        }
        for k in ["vendor_name", "customer_name", "party_a", "party_b", "holder_name"]:
            if k in entities:
                val = entities[k].strip()
                if val.upper() in BOGUS_VALUES or len(val) <= 2:
                    del entities[k]

        # 4. If entities are still sparse, add header line and metrics so data is never empty
        if len(entities) < 2 and lines:
            entities["document_heading"] = lines[0][:80]
            if len(lines) > 1:
                entities["document_excerpt"] = lines[1][:100]
            entities["word_count"] = str(len(full_text.split()))
            entities["line_count"] = str(len(lines))

        formatted_entities = [{"field": k, "value": v, "confidence": 0.95, "source": "hybrid"} for k, v in entities.items()]
        
        return {
            "entities": formatted_entities,
            "fields": entities,
            "confidence": 0.95,
            "method": "hybrid"
        }

extractor = HybridExtractor()
