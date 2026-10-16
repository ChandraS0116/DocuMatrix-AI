import uuid
import datetime
import random
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.database import Document, OcrResult, Classification, ExtractedData, BusinessAction

router = APIRouter()

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    tenant_id = "default"
    
    # 1. High Risk Invoice (Apex Financial Services)
    doc_1_id = uuid.uuid4()
    doc_1 = Document(id=doc_1_id, tenant_id=tenant_id, filename="Apex_Invoice_Q3.pdf", storage_path="mock/path", status="COMPLETED", mime_type="application/pdf")
    ext_1 = ExtractedData(
        tenant_id=tenant_id, document_id=doc_1.id, schema_type="generic", extractor_version="hybrid",
        structured_json={"fields": {"invoice_number": "APX-8821", "vendor_name": "Apex Financial Services", "total_amount": "145000.00", "date": "2026-09-15"}}
    )
    cls_1 = Classification(tenant_id=tenant_id, document_id=doc_1.id, predicted_class="invoice", confidence_score=0.96, classifier_version="distilbert")
    ba_1 = BusinessAction(
        tenant_id=tenant_id, document_id=doc_1.id, status="Needs Review", risk_level="HIGH", recommended_action="Escalate to VP Finance", reasoning="Invoice amount ($145,000.00) exceeds $50k auto-approval threshold. Vendor history indicates anomalous billing spike."
    )
    
    ocr_1 = OcrResult(
        tenant_id=tenant_id, document_id=doc_1.id, ocr_engine_version="pypdf_native", processing_duration_ms=210, page_count=1,
        raw_response={"engine": "pypdf_native", "success": True},
        canonical_document={"text": "INVOICE APX-8821\nVendor: Apex Financial Services\nDate: 2026-09-15\nTotal Amount: $145,000.00\nPayment Terms: Net 30\nLine Item 1: Advisory Retainer ($145,000.00)", "blocks": []}
    )
    
    # 2. High Risk Contract (Global Logistics Ltd)
    doc_2_id = uuid.uuid4()
    doc_2 = Document(id=doc_2_id, tenant_id=tenant_id, filename="GL_Master_Service_Agreement_Draft.pdf", storage_path="mock/path", status="COMPLETED", mime_type="application/pdf")
    ext_2 = ExtractedData(
        tenant_id=tenant_id, document_id=doc_2.id, schema_type="generic", extractor_version="hybrid",
        structured_json={"fields": {"contract_title": "Master Service Agreement", "party_a": "Global Logistics Ltd", "party_b": "Acme Manufacturing", "is_signed": False, "effective_date": "2026-10-01"}}
    )
    cls_2 = Classification(tenant_id=tenant_id, document_id=doc_2.id, predicted_class="contract", confidence_score=0.98, classifier_version="distilbert")
    ba_2 = BusinessAction(
        tenant_id=tenant_id, document_id=doc_2.id, status="High Risk", risk_level="HIGH", recommended_action="Request Missing Signature", reasoning="Contract is missing required counter-party signatures from Global Logistics Ltd. Non-standard indemnification clause detected."
    )
    ocr_2 = OcrResult(
        tenant_id=tenant_id, document_id=doc_2.id, ocr_engine_version="pypdf_native", processing_duration_ms=340, page_count=4,
        raw_response={"engine": "pypdf_native", "success": True},
        canonical_document={"text": "MASTER SERVICES AGREEMENT\nBetween Global Logistics Ltd (Carrier) and Acme Manufacturing (Shipper)\nEffective Date: October 1, 2026\nTerms & Conditions: Standard logistics SLA with expedited delivery options.\nSignatures: Missing Counter-Party Signature.", "blocks": []}
    )
    
    # 3. Safe Invoice (Acme Manufacturing)
    doc_3_id = uuid.uuid4()
    doc_3 = Document(id=doc_3_id, tenant_id=tenant_id, filename="Acme_Monthly_Parts_Order.pdf", storage_path="mock/path", status="COMPLETED", mime_type="application/pdf")
    ext_3 = ExtractedData(
        tenant_id=tenant_id, document_id=doc_3.id, schema_type="generic", extractor_version="hybrid",
        structured_json={"fields": {"invoice_number": "ACM-2026-04", "vendor_name": "Acme Manufacturing", "total_amount": "1250.00", "date": "2026-06-01"}}
    )
    cls_3 = Classification(tenant_id=tenant_id, document_id=doc_3.id, predicted_class="invoice", confidence_score=0.99, classifier_version="distilbert")
    ba_3 = BusinessAction(
        tenant_id=tenant_id, document_id=doc_3.id, status="Safe", risk_level="LOW", recommended_action="Auto-Pay Approved", reasoning="Invoice amount is within normal operational thresholds. Trusted vendor status verified."
    )
    ocr_3 = OcrResult(
        tenant_id=tenant_id, document_id=doc_3.id, ocr_engine_version="pypdf_native", processing_duration_ms=180, page_count=1,
        raw_response={"engine": "pypdf_native", "success": True},
        canonical_document={"text": "ACME MANUFACTURING CORP\nInvoice: ACM-2026-04\nDate: 2026-06-01\nTotal Amount: $1,250.00\nSubtotal: $1,150.00\nTax: $100.00\nStatus: Paid via Corporate P-Card", "blocks": []}
    )

    # 4. Compliance Report (Northwind Healthcare)
    doc_4_id = uuid.uuid4()
    doc_4 = Document(id=doc_4_id, tenant_id=tenant_id, filename="Northwind_HIPAA_Audit_2026.pdf", storage_path="mock/path", status="COMPLETED", mime_type="application/pdf")
    ext_4 = ExtractedData(
        tenant_id=tenant_id, document_id=doc_4.id, schema_type="generic", extractor_version="hybrid",
        structured_json={"fields": {"report_type": "HIPAA Compliance Audit", "entity_name": "Northwind Healthcare", "audit_score": "82/100", "critical_findings": 2}}
    )
    cls_4 = Classification(tenant_id=tenant_id, document_id=doc_4.id, predicted_class="compliance_report", confidence_score=0.92, classifier_version="distilbert")
    ba_4 = BusinessAction(
        tenant_id=tenant_id, document_id=doc_4.id, status="Needs Review", risk_level="MEDIUM", recommended_action="Schedule Remediation Review", reasoning="Audit score is passing, but 2 critical findings require remediation planning within 30 days."
    )
    ocr_4 = OcrResult(
        tenant_id=tenant_id, document_id=doc_4.id, ocr_engine_version="pypdf_native", processing_duration_ms=410, page_count=8,
        raw_response={"engine": "pypdf_native", "success": True},
        canonical_document={"text": "ANNUAL HIPAA COMPLIANCE & SECURITY AUDIT\nAudited Organization: Northwind Healthcare Systems\nScore: 82 / 100\nCritical Findings: 2\nSummary: Overall security posture is acceptable; encryption key rotation required within 30 days.", "blocks": []}
    )

    db.add_all([
        doc_1, ext_1, cls_1, ba_1, ocr_1,
        doc_2, ext_2, cls_2, ba_2, ocr_2,
        doc_3, ext_3, cls_3, ba_3, ocr_3,
        doc_4, ext_4, cls_4, ba_4, ocr_4
    ])
    db.commit()
    
    return {"status": "success", "message": "Demo data successfully seeded."}
