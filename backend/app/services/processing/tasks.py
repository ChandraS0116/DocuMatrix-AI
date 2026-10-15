import os
try:
    from celery import Celery
    from celery.exceptions import MaxRetriesExceededError
except ImportError:
    Celery = None
    class MaxRetriesExceededError(Exception): pass

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
import time
from datetime import datetime

from app.db.session import SessionLocal, engine
from app.models.database import Document, AuditLog, OcrResult, Classification, ExtractedData, ValidationResultRecord
from app.services.storage.minio import minio_service

from app.services.ocr.ocr_engine import ocr_router
from app.services.ml.classifier import classifier
from app.services.ml.extractor import extractor
from app.services.rag.embeddings import embedding_generator
from app.services.search.elasticsearch_client import es_client
from app.services.risk.risk_engine import risk_engine
from app.services.insights.insight_engine import insight_engine
from app.models.database import Document, AuditLog, OcrResult, Classification, ExtractedData, ValidationResultRecord, BusinessAction

from app.models.search_schemas import SearchDocumentModel

from app.services.autonomy.pipeline_controller import PipelineController, StructuredPipelineDecision, PipelineAction
from app.services.autonomy.signal_collector import signal_collector
from app.services.control.execution_router import execution_router
from app.services.autonomy.execution_engine import ExecutionEngine

from app.observability.logger import set_trace_id, set_tenant_id, get_logger
from app.observability.metrics import dead_letter_queue_total, documents_processed_total, MetricsTimer, ocr_latency_ms, classification_latency_ms, extraction_latency_ms, indexing_delay_ms
from app.billing.usage_tracker import usage_tracker

logger = get_logger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
from app.celery import celery as celery_app
if REDIS_AVAILABLE:
    redis_client = redis.from_url(REDIS_URL)
else:
    class MockRedis:
        def setnx(self, k, v): return True
        def expire(self, k, v): pass
        def delete(self, k): pass
    redis_client = MockRedis()

def execute_node_action(action: PipelineAction, inputs: dict, document_id: str, db):
    doc = db.query(Document).filter(Document.id == document_id).first()
    
    if action == PipelineAction.OCR_REPROCESS_ENHANCED:
        start_time = time.time()
        file_bytes = minio_service.download_file(doc.storage_path)
        
        try:
            with MetricsTimer(ocr_latency_ms):
                result = ocr_router.process(file_bytes)
                fallback_used = result.get("source") == "fallback"
                
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f"[TELEMETRY] Stage: OCR | Latency: {latency_ms}ms | Fallback: {fallback_used}")
            
            ocr_result = db.query(OcrResult).filter(OcrResult.document_id == document_id).first()
            if not ocr_result:
                ocr_result = OcrResult(
                    document_id=doc.id, ocr_engine_version=result.get("source", "unknown"),
                    processing_duration_ms=latency_ms, page_count=1,
                    raw_response=result, canonical_document={"text": result.get("raw_text"), "blocks": result.get("bounding_boxes")}
                )
                db.add(ocr_result)
            else:
                ocr_result.canonical_document = {"text": result.get("raw_text"), "blocks": result.get("bounding_boxes")}
                ocr_result.ocr_engine_version = result.get("source", "unknown")
                
            doc.page_count = 1
            doc.status = "OCR_COMPLETED"
            db.commit()
            return {"status": "success", "confidence": result.get("confidence_score", 0.0)}
        except Exception as e:
            logger.error(f"OCR Exception: {e}")
            db.rollback()
            return {"status": "failed", "error": str(e), "confidence": 0.0}

    elif action in [PipelineAction.PROCEED_TO_CLASSIFICATION, PipelineAction.CLASSIFY_USING_ML_STRONG_MODEL]:
        start_time = time.time()
        try:
            ocr_result = db.query(OcrResult).filter(OcrResult.document_id == document_id).first()
            if not ocr_result:
                raise Exception("Cannot classify: No OCR result found.")
                
            text = ocr_result.canonical_document.get("text", "")
            
            with MetricsTimer(classification_latency_ms):
                class_result = classifier.classify(text)
                fallback_used = class_result.get("model_used") == "fallback"
                
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f"[TELEMETRY] Stage: CLASSIFICATION | Latency: {latency_ms}ms | Fallback: {fallback_used}")
                
            class_rec = db.query(Classification).filter(Classification.document_id == document_id).first()
            if not class_rec:
                class_rec = Classification(
                    tenant_id=doc.tenant_id, document_id=doc.id, predicted_class=class_result.get("label"),
                    confidence_score=class_result.get("confidence"), class_probabilities=class_result.get("probabilities", []),
                    classifier_version=class_result.get("model_used"), inference_latency_ms=latency_ms,
                    fallback_used=fallback_used, classification_explanation=""
                )
                db.add(class_rec)
            else:
                class_rec.predicted_class = class_result.get("label")
                
            doc.status = "CLASSIFICATION_COMPLETED"
            db.commit()
            return {"predicted_class": class_result.get("label"), "confidence": class_result.get("confidence")}
        except Exception as e:
            logger.error(f"Classification Exception: {e}")
            db.rollback()
            return {"predicted_class": "unknown", "confidence": 0.0, "error": str(e)}

    elif action in [PipelineAction.PROCEED_TO_EXTRACTION, PipelineAction.SWITCH_TO_FALLBACK_EXTRACTION]:
        start_time = time.time()
        try:
            ocr_result = db.query(OcrResult).filter(OcrResult.document_id == document_id).first()
            
            blocks = ocr_result.canonical_document.get("blocks", [])
            words = [b.get("text") for b in blocks if "text" in b]
            boxes = [b.get("bbox") for b in blocks if "bbox" in b]
            
            with MetricsTimer(extraction_latency_ms):
                file_bytes = minio_service.download_file(doc.storage_path)
                import numpy as np
                import cv2
                from PIL import Image
                nparr = np.frombuffer(file_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                
                ext_result = extractor.extract(img_pil, words, boxes)
                fallback_used = len(ext_result.get("entities", [])) == 0
                
            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(f"[TELEMETRY] Stage: EXTRACTION | Latency: {latency_ms}ms | Fallback: {fallback_used}")
                
            extracted_data = db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
            if not extracted_data:
                extracted_data = ExtractedData(
                    tenant_id=doc.tenant_id, document_id=doc.id, schema_type="generic",
                    structured_json=ext_result, extractor_version="layoutlmv3",
                    extraction_model_version="layoutlmv3-base", fallback_used=fallback_used,
                    token_label_distribution={}, entity_count=len(ext_result.get("entities", []))
                )
                db.add(extracted_data)
            
            doc.status = "EXTRACTION_COMPLETED"
            db.commit()
            return {"entity_count": len(ext_result.get("entities", []))}
        except Exception as e:
            logger.error(f"Extraction Exception: {e}")
            db.rollback()
            return {"entity_count": 0, "error": str(e)}

    elif action == PipelineAction.PROCEED_TO_VALIDATION:
        try:
            from app.services.validation.validator import ValidatorFactory
            extracted_rec = db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
            class_rec = db.query(Classification).filter(Classification.document_id == document_id).first()
            doc_type = (class_rec.predicted_class or "generic").lower() if class_rec else "generic"
            fields = extracted_rec.structured_json if extracted_rec and extracted_rec.structured_json else {}

            validator = ValidatorFactory.get_validator(doc_type)
            rule_results = validator.validate_document(fields, db)
            is_valid = all(getattr(r, 'is_valid', True) for r in rule_results) if rule_results else True
            failed_rules = sum(1 for r in rule_results if not getattr(r, 'is_valid', True)) if rule_results else 0

            val_record = db.query(ValidationResultRecord).filter(ValidationResultRecord.document_id == document_id).first()
            rule_dicts = [{"rule_id": getattr(r, 'rule_id', str(idx)), "is_valid": getattr(r, 'is_valid', True), "message": getattr(r, 'message', '')} for idx, r in enumerate(rule_results)]
            if not val_record:
                val_record = ValidationResultRecord(
                    tenant_id=doc.tenant_id,
                    document_id=doc.id,
                    is_valid=is_valid,
                    rule_results=rule_dicts
                )
                db.add(val_record)
            else:
                val_record.is_valid = is_valid
                val_record.rule_results = rule_dicts
            doc.status = "VALIDATION_COMPLETED"
            db.commit()
            return {"is_valid": is_valid, "failed_rules": failed_rules}
        except Exception as e:
            logger.error(f"Validation Exception: {e}")
            db.rollback()
            return {"is_valid": True, "failed_rules": 0}

    elif action == PipelineAction.SEND_TO_HITL_PRIORITY:
        doc.status = "REVIEW_REQUIRED"
        db.commit()
        return {"status": "escalated"}

    elif action == PipelineAction.PROCEED_TO_INDEXING:
        # Run Business Action / Risk Engine
        try:
            extracted_data = db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
            class_rec = db.query(Classification).filter(Classification.document_id == document_id).first()
            
            doc_type = class_rec.predicted_class if class_rec else "unknown"
            fields = extracted_data.structured_json.get("fields", {}) if extracted_data else {}
            
            risk_profile = risk_engine.evaluate(doc_type, fields)
            insights_profile = insight_engine.generate_executive_summary(doc_type, fields, risk_profile)
            
            ba = BusinessAction(
                tenant_id=doc.tenant_id,
                document_id=doc.id,
                status=risk_profile.get("status"),
                risk_level=risk_profile.get("risk_level"),
                recommended_action=risk_profile.get("recommended_action"),
                reasoning=risk_profile.get("reasoning")
            )
            db.add(ba)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to generate Business Action: {e}")
            db.rollback()

        doc.status = "COMPLETED"
        db.commit()
        documents_processed_total.labels(tenant_id=doc.tenant_id, status=doc.status).inc()
        index_document_task.delay(str(doc.id))
        
        # Track usage for billing
        try:
            ocr_result = db.query(OcrResult).filter(OcrResult.document_id == document_id).first()
            pages = ocr_result.page_count if ocr_result else 1
            usage_tracker.track_usage(
                db=db,
                tenant_id=doc.tenant_id,
                event_type="document_processed",
                units=pages,
                cost=0.01 * pages,  # E.g., $0.01 per page
                idempotency_key=f"{document_id}_processing_complete"
            )
        except Exception as e:
            logger.error(f"Failed to track usage: {e}")
            
        return {"status": "indexed"}

    return {"status": "ignored"}

@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_document_task(self, document_id: str):
    trace_id = set_trace_id(self.request.id)
    lock_key = f"doc_lock_{document_id}"
    if not redis_client.setnx(lock_key, "1"):
        logger.warning(f"Task for {document_id} is already running. Idempotency lock triggered.")
        return
    redis_client.expire(lock_key, 3600)

    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc or doc.status in ["COMPLETED", "FAILED"]:
            return
            
        set_tenant_id(doc.tenant_id)
        doc.status = "PROCESSING"
        db.commit()
        
        controller = PipelineController()
        context = signal_collector.collect(document_id, db)
        decision = controller.route(context, "PRE_OCR", db)
        graph = execution_router.route(context, decision, document_id, db)
        engine = ExecutionEngine(executor_callback=execute_node_action)
        engine.run(graph, context, db)

    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        try:
            self.retry(exc=e)
        except MaxRetriesExceededError:
            dead_letter_queue_total.labels(stage="process_document").inc()
            db.rollback()
            doc.status = "FAILED"
            db.commit()
            
    finally:
        redis_client.delete(lock_key)
        db.close()

@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def index_document_task(self, document_id: str):
    start_time = time.time()
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return
            
        ocr_record = db.query(OcrResult).filter(OcrResult.document_id == document_id).first()
        searchable_text = ocr_record.canonical_document.get("text", "") if ocr_record else ""
        
        emb_start = time.time()
        emb_result = embedding_generator.generate(searchable_text, doc.tenant_id)
        emb_latency_ms = int((time.time() - emb_start) * 1000)
        logger.info(f"[TELEMETRY] Stage: EMBEDDINGS | Latency: {emb_latency_ms}ms | Fallback: {emb_result.get('provider') != 'openai'}")

        class_rec = db.query(Classification).filter(Classification.document_id == document_id).first()
        doc_type = class_rec.predicted_class if class_rec and class_rec.predicted_class else "unknown"
        created_time = doc.created_at.isoformat() if doc.created_at else datetime.utcnow().isoformat()
        extracted_rec = db.query(ExtractedData).filter(ExtractedData.document_id == document_id).first()
        extracted_data_dict = extracted_rec.structured_json if extracted_rec and extracted_rec.structured_json else {}

        search_model = SearchDocumentModel(
            document_id=str(doc.id),
            filename=doc.filename,
            document_type=doc_type,
            processing_status=doc.status,
            validation_status="VALID",
            created_at=created_time,
            index_version="document_chunks_v1",
            searchable_text=searchable_text.strip(),
            tenant_id=doc.tenant_id,
            shard_routing_key=doc.tenant_id,
            index_alias="document_chunks_v1",
            owner_id="system",
            visibility="SHARED",
            extracted_fields=extracted_data_dict,
            line_items=[],
            sections={}
        )
        
        with MetricsTimer(indexing_delay_ms):
            success = es_client.index_document(
                tenant_id=doc.tenant_id,
                document_id=str(doc.id), 
                text=searchable_text,
                embeddings=emb_result.get("vector", []),
                metadata=search_model.model_dump()
            )
            
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[TELEMETRY] Stage: ELASTICSEARCH | Latency: {latency_ms}ms | Fallback: {not success}")
        
        db.commit()
    except Exception as e:
        logger.error(f"Indexing failed: {str(e)}")
        db.rollback()
        raise e
    finally:
        db.close()
