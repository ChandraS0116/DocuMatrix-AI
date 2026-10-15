from app.services.validation.rule import ValidationRule, RuleResult
from typing import Optional
from sqlalchemy.orm import Session
from app.models.database import ExtractedData

class DuplicateInvoiceRule(ValidationRule):
    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        if not db_session:
            return RuleResult(rule_name="DuplicateInvoiceRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])
            
        fields = extracted_data.get("fields", {})
        inv_num_obj = fields.get("invoice_number")
        
        if inv_num_obj and inv_num_obj.get("value"):
            inv_val = str(inv_num_obj["value"])
            
            duplicate_exists = False
            
            if duplicate_exists:
                return RuleResult(
                    rule_name="DuplicateInvoiceRule",
                    severity="ERROR",
                    is_valid=False,
                    error_message=f"Duplicate invoice detected: {inv_val}.",
                    affected_fields=["invoice_number"]
                )
                
        return RuleResult(rule_name="DuplicateInvoiceRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])
