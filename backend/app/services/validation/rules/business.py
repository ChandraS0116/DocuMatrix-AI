from app.services.validation.rule import ValidationRule, RuleResult
from typing import Optional
from sqlalchemy.orm import Session

class AmountRangeRule(ValidationRule):
    def __init__(self, field_name: str, min_val: float, max_val: float):
        self.field_name = field_name
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        fields = extracted_data.get("extracted_entities", {})
        if not fields:
            legacy = extracted_data.get("fields", {})
            for k, v in legacy.items():
                if isinstance(v, dict) and "value" in v:
                    fields[k] = v["value"]
                    
        val_str = fields.get(self.field_name) or fields.get(self.field_name.upper()) or fields.get(self.field_name.lower())
        
        if val_str is not None:
            try:
                val = float(val_str)
                if val < self.min_val or val > self.max_val:
                    return RuleResult(
                        rule_name="AmountRangeRule",
                        severity="WARNING",
                        is_valid=False,
                        error_message=f"{self.field_name} ({val}) is outside expected range ({self.min_val}-{self.max_val}).",
                        affected_fields=[self.field_name]
                    )
            except ValueError:
                pass 
                
        return RuleResult(rule_name="AmountRangeRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])

class MathematicalIntegrityRule(ValidationRule):
    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        fields = extracted_data.get("extracted_entities", {})
        if not fields:
            legacy = extracted_data.get("fields", {})
            for k, v in legacy.items():
                if isinstance(v, dict) and "value" in v:
                    fields[k] = v["value"]
                    
        total_val_str = fields.get("total_amount") or fields.get("TOTAL_AMOUNT")
        
        if not total_val_str:
            return RuleResult(rule_name="MathematicalIntegrityRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])
            
        try:
            total_val = float(total_val_str)
            
            calculated_subtotal = 0.0
            
            # Simple simulation for new schema since line_items is flat in extracted_entities
            for k, v in fields.items():
                if "PRICE" in k.upper():
                    try:
                        calculated_subtotal += float(v)
                    except ValueError:
                        pass
                        
            # If no price entities found, we skip logic so it doesn't fail natively
            if calculated_subtotal == 0.0:
                return RuleResult(rule_name="MathematicalIntegrityRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])
                
            if abs(calculated_subtotal - total_val) > 0.01:
                return RuleResult(
                    rule_name="MathematicalIntegrityRule",
                    severity="ERROR",
                    is_valid=False,
                    error_message=f"Line items sum ({calculated_subtotal}) != total ({total_val}).",
                    affected_fields=["total_amount", "line_items"]
                )
        except ValueError:
            pass
            
        return RuleResult(rule_name="MathematicalIntegrityRule", severity="INFO", is_valid=True, error_message="", affected_fields=[])
