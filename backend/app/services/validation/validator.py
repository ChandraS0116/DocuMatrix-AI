from app.services.validation.rules.structural import RequiredFieldRule, DataTypeRule
from app.services.validation.rules.business import AmountRangeRule, MathematicalIntegrityRule
from app.services.validation.rules.consistency import DuplicateInvoiceRule
from typing import Optional
from sqlalchemy.orm import Session

class DocumentValidator:
    def __init__(self, rules: list):
        self.rules = rules
        
    def validate_document(self, extracted_data: dict, db_session: Optional[Session] = None) -> list:
        results = []
        for rule in self.rules:
            res = rule.validate(extracted_data, db_session)
            results.append(res)
        return results

class ValidatorFactory:
    @staticmethod
    def get_validator(document_type: str) -> DocumentValidator:
        if document_type == "invoice":
            return DocumentValidator([
                RequiredFieldRule(["invoice_number", "total_amount"]),
                DataTypeRule(["total_amount"]),
                MathematicalIntegrityRule(),
                AmountRangeRule("total_amount", 0.0, 1000000.0),
                DuplicateInvoiceRule()
            ])
        return DocumentValidator([])
