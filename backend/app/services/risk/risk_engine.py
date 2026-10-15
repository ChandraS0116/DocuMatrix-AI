import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class RiskEngine:
    def evaluate(self, document_type: str, extracted_fields: Dict[str, Any]) -> Dict[str, str]:
        # Heuristic rules
        if document_type == "invoice":
            return self._evaluate_invoice(extracted_fields)
        elif document_type == "contract":
            return self._evaluate_contract(extracted_fields)
        else:
            return {
                "status": "Needs Review",
                "risk_level": "MEDIUM",
                "recommended_action": "Manual Classification Review",
                "reasoning": f"Document type '{document_type}' is unrecognized. Requires manual routing."
            }

    def _evaluate_invoice(self, fields: Dict[str, Any]) -> Dict[str, str]:
        amount_str = fields.get("total_amount", "0")
        try:
            clean_amt = amount_str.replace('$', '').replace(',', '')
            amount = float(clean_amt)
        except Exception:
            amount = 0.0

        vendor = fields.get("vendor_name")
        
        if not vendor:
            return {
                "status": "High Risk",
                "risk_level": "HIGH",
                "recommended_action": "Fraud Review",
                "reasoning": "Missing vendor name on invoice. Potential fraudulent submission."
            }
            
        if amount > 50000:
            return {
                "status": "Needs Review",
                "risk_level": "HIGH",
                "recommended_action": "Escalate to VP Finance",
                "reasoning": f"Invoice amount (${amount}) exceeds $50k auto-approval threshold."
            }
            
        if amount > 10000:
            return {
                "status": "Needs Review",
                "risk_level": "MEDIUM",
                "recommended_action": "Manager Approval Required",
                "reasoning": f"Invoice amount (${amount}) requires standard manager approval."
            }
            
        return {
            "status": "Safe",
            "risk_level": "LOW",
            "recommended_action": "Auto-Pay",
            "reasoning": "Invoice amount is within normal operational thresholds with known vendor."
        }

    def _evaluate_contract(self, fields: Dict[str, Any]) -> Dict[str, str]:
        missing_signatures = not fields.get("is_signed", True)
        missing_date = not fields.get("effective_date")
        
        if missing_signatures:
            return {
                "status": "High Risk",
                "risk_level": "HIGH",
                "recommended_action": "Request Missing Signature",
                "reasoning": "Contract is missing one or more required counter-party signatures."
            }
            
        if missing_date:
            return {
                "status": "Needs Review",
                "risk_level": "MEDIUM",
                "recommended_action": "Review Contract Dates",
                "reasoning": "Effective date is not explicitly stated in the document."
            }
            
        return {
            "status": "Safe",
            "risk_level": "LOW",
            "recommended_action": "Archive Contract",
            "reasoning": "Contract appears fully executed and dated."
        }

risk_engine = RiskEngine()
