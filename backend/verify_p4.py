import sys
import os

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.risk.risk_engine import risk_engine
from app.services.insights.insight_engine import insight_engine

def verify_business_intelligence():
    print("=== VERIFYING P4 BUSINESS ACTION CENTER ===")
    
    # 1. Test Invoice Risk Evaluation
    print("\n--- Testing High Risk Invoice ---")
    high_risk_invoice_fields = {
        "invoice_number": "INV-9999",
        "vendor_name": "Unknown Entity Corp",
        "total_amount": "120000.00"
    }
    risk_res_1 = risk_engine.evaluate("invoice", high_risk_invoice_fields)
    print("Risk Level:", risk_res_1.get("risk_level"))
    print("Recommended Action:", risk_res_1.get("recommended_action"))
    print("Reasoning:", risk_res_1.get("reasoning"))
    assert risk_res_1.get("risk_level") == "HIGH"
    
    # 2. Test Contract Insight Generation
    print("\n--- Testing High Risk Contract ---")
    missing_signature_contract_fields = {
        "party_a": "Acme Corp",
        "is_signed": False,
        "effective_date": "2026-08-01"
    }
    risk_res_2 = risk_engine.evaluate("contract", missing_signature_contract_fields)
    
    insight_res = insight_engine.generate_executive_summary("contract", missing_signature_contract_fields, risk_res_2)
    print("Key Risks:", insight_res.get("key_risks"))
    print("Recommended Actions:", insight_res.get("recommended_actions"))
    assert insight_res.get("key_risks")[0] == risk_res_2.get("reasoning")
    
    print("\n=== P4 VERIFICATION SUCCESSFUL ===")

if __name__ == "__main__":
    verify_business_intelligence()
