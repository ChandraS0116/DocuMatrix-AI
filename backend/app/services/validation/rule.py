from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

class RuleResult(BaseModel):
    rule_name: str
    severity: str
    is_valid: bool
    error_message: str
    affected_fields: List[str]

class ValidationRule(ABC):
    @abstractmethod
    def validate(self, extracted_data: dict, db_session: Optional[Session] = None) -> RuleResult:
        """
        Validates extracted data and returns a RuleResult.
        """
        pass
