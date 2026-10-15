from app.services.validation.rule import ValidationRule, RuleResult
from typing import Optional
from sqlalchemy.orm import Session

class RequiredFieldRule(ValidationRule):
    def __init__(self, required_fields: list):
        self.required_fields = required_fields

    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        fields = extracted_data.get("extracted_entities", {})
        if not fields:
            # Fallback legacy support
            legacy = extracted_data.get("fields", {})
            for k, v in legacy.items():
                if isinstance(v, dict) and "value" in v:
                    fields[k] = v["value"]
                    
        missing = []
        
        for req in self.required_fields:
            if req not in fields and req.upper() not in fields and req.lower() not in fields:
                missing.append(req)
                
        is_valid = len(missing) == 0
        return RuleResult(
            rule_name="RequiredFieldRule",
            severity="ERROR" if not is_valid else "INFO",
            is_valid=is_valid,
            error_message=f"Missing required fields: {', '.join(missing)}" if not is_valid else "",
            affected_fields=missing
        )

class DataTypeRule(ValidationRule):
    def __init__(self, float_fields: list):
        self.float_fields = float_fields

    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        fields = extracted_data.get("extracted_entities", {})
        if not fields:
            legacy = extracted_data.get("fields", {})
            for k, v in legacy.items():
                if isinstance(v, dict) and "value" in v:
                    fields[k] = v["value"]
                    
        invalid = []
        
        for f in self.float_fields:
            val = fields.get(f) or fields.get(f.upper()) or fields.get(f.lower())
            if val is not None:
                try:
                    float(val)
                except ValueError:
                    invalid.append(f)
                    
        is_valid = len(invalid) == 0
        return RuleResult(
            rule_name="DataTypeRule",
            severity="ERROR" if not is_valid else "INFO",
            is_valid=is_valid,
            error_message=f"Fields cannot be cast to expected types: {', '.join(invalid)}" if not is_valid else "",
            affected_fields=invalid
        )
