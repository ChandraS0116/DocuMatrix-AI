# Kubernetes Cluster Architecture

The Document Intelligence Platform utilizes a strict node-pool separation strategy to guarantee isolation between resource-intensive GPU inference and highly concurrent CPU-bound tasks.

## 1. GPU Pool (Inference Heavy)
**Workloads**: LayoutLMv3 extraction, classification (transformers), Batch Inference Engine.
**Scaling**: Bound to KEDA (Event-driven based on `queue.ml.gpu.batch` depth). HPA acts only as a `maxReplicas` ceiling.
```yaml
nodeSelector:
  node-type: gpu
tolerations:
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"
```

## 2. CPU Pool (Light Workloads)
**Workloads**: OCR preprocessing, embedding fallbacks, API Gateway, Tenant Scheduler.
**Scaling**: HPA bound to CPU utilization.
```yaml
nodeSelector:
  node-type: cpu
```

## 3. Memory-Optimized Pool (Search + Storage)
**Workloads**: Elasticsearch, Embedding cache, Redis, Retrieval services.
**Scaling**: StatefulSets with persistent volumes.
```yaml
nodeSelector:
  node-type: memory-optimized
```
