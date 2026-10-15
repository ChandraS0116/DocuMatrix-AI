from typing import Dict, Any, List

class InsightEngine:
    def generate_executive_summary(self, document_type: str, fields: Dict[str, Any], risk_profile: Dict[str, str]) -> Dict[str, Any]:
        entities = [{"key": k, "value": v} for k, v in fields.items()]
        
        insights = []
        if document_type == "invoice":
            insights.append("Invoice processed within standard 30-day term limits.")
            if risk_profile.get("risk_level") == "HIGH":
                insights.append("High value transaction. Verify budget allocation.")
        elif document_type == "contract":
            insights.append("Standard liability limits apply.")
            if risk_profile.get("status") == "High Risk":
                insights.append("Execution phase blocked until compliance review is completed.")
                
        return {
            "document_summary": f"This is an automated extraction of a {document_type} document. The document was processed by the hybrid extraction engine.",
            "key_entities": entities,
            "key_risks": [risk_profile.get("reasoning", "None identified.")],
            "recommended_actions": [risk_profile.get("recommended_action", "No action required.")],
            "insights": insights
        }

insight_engine = InsightEngine()
