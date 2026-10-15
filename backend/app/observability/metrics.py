import time
from prometheus_client import Counter, Histogram, Gauge

# Latency Histograms
ocr_latency_ms = Histogram('ocr_latency_ms', 'Latency of OCR engine in milliseconds')
classification_latency_ms = Histogram('classification_latency_ms', 'Latency of ML Classification in milliseconds')
extraction_latency_ms = Histogram('extraction_latency_ms', 'Latency of ML Extraction in milliseconds')
indexing_delay_ms = Histogram('indexing_delay_ms', 'Delay in indexing to Elasticsearch in milliseconds')
rag_response_latency_ms = Histogram('rag_response_latency_ms', 'Latency of RAG responses in milliseconds')

# Gauge Metrics
queue_depth_per_tenant = Gauge('queue_depth_per_tenant', 'Queue Depth', ['tenant_id', 'queue_name'])
gpu_utilization = Gauge('gpu_utilization', 'GPU Utilization %')
worker_saturation = Gauge('worker_saturation', 'Worker saturation %', ['cluster'])
ocr_fail_rate_by_region = Gauge('ocr_fail_rate_by_region', 'OCR Fail Rate', ['region'])

# Counters
validation_failure_total = Counter('validation_failure_total', 'Total number of validation failures', ['rule_name'])
dead_letter_queue_total = Counter('dlq_total', 'Total number of tasks sent to DLQ', ['stage'])
documents_processed_total = Counter('documents_processed_total', 'Total documents processed', ['tenant_id', 'status'])
embedding_throughput = Counter('embedding_throughput', 'Embeddings processed', ['tenant_id'])

class MetricsTimer:
    def __init__(self, histogram: Histogram):
        self.histogram = histogram
        self.start_time = None
        
    def __enter__(self):
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        latency_ms = (time.time() - self.start_time) * 1000
        self.histogram.observe(latency_ms)
