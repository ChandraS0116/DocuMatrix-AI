import os
import logging

try:
    from elasticsearch import Elasticsearch, helpers
except ImportError:
    Elasticsearch = None
    helpers = None

logger = logging.getLogger(__name__)

class ESClient:
    def __init__(self):
        self.url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
        self.client = None
        self.index_name = "document_chunks_v1"
        self._initialized = False

    def _lazy_init(self):
        if self._initialized: return
        self._initialized = True
        if Elasticsearch:
            try:
                self.client = Elasticsearch(self.url, retry_on_timeout=True, max_retries=3)
                self._ensure_index()
            except Exception as e:
                logger.error(f"Elasticsearch connection failed on lazy init: {e}")
                self.client = None
        else:
            logger.warning("Elasticsearch Python client not installed.")

    def _ensure_index(self):
        if not self.client: return
        try:
            if not self.client.indices.exists(index="document_chunks_v1"):
                mapping = {
                    "mappings": {
                        "properties": {
                            "tenant_id": {"type": "keyword"},
                            "document_id": {"type": "keyword"},
                            "text": {"type": "text"},
                            "embeddings": {
                                "type": "dense_vector",
                                "dims": 3072,
                                "index": True,
                                "similarity": "cosine"
                            },
                            "metadata": {"type": "object"}
                        }
                    }
                }
                self.client.indices.create(index="document_chunks_v1", body=mapping)
                logger.info("Created document_chunks_v1 index with vector mapping.")
        except Exception as e:
            logger.error(f"Failed to create index: {e}")

    def index_document(self, tenant_id: str, document_id: str, text: str, embeddings: list, metadata: dict = None):
        self._lazy_init()
        if not self.client:
            return False

        doc = {
            "tenant_id": tenant_id,
            "document_id": document_id,
            "text": text,
            "embeddings": embeddings,
            "metadata": metadata or {}
        }
        
        try:
            self.client.index(index=self.index_name, id=document_id, document=doc)
            return True
        except Exception as e:
            logger.error(f"Failed to index document {document_id}: {e}")
            return False
            
    def index_bulk(self, actions: list):
        self._lazy_init()
        if not self.client or not helpers:
            return False
        try:
            helpers.bulk(self.client, actions)
            return True
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            return False

    def search_documents(self, tenant_id: str, query: str, limit: int = 10):
        self._lazy_init()
        if not self.client: return []
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"text": query}}
                    ],
                    "filter": [
                        {"term": {"tenant_id": tenant_id}}
                    ]
                }
            },
            "size": limit,
            "highlight": {
                "fields": {"text": {}},
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        }
        try:
            res = self.client.search(index=self.index_name, body=body)
            results = []
            for hit in res["hits"]["hits"]:
                source = hit["_source"]
                if "highlight" in hit and "text" in hit["highlight"]:
                    source["highlight"] = hit["highlight"]["text"]
                results.append(source)
            return results
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def search(self, tenant_id: str, query_text: str = "", query: str = "", limit: int = 10):
        search_query = query_text or query or ""
        return self.search_documents(tenant_id=tenant_id, query=search_query, limit=limit)

    def get_document(self, index: str = "document_chunks_v1", document_id: str = ""):
        self._lazy_init()
        if not self.client or not document_id: return None
        try:
            return self.client.get(index=self.index_name, id=document_id)
        except Exception as e:
            logger.warning(f"Document {document_id} not found in ES: {e}")
            return None

    def hybrid_search(self, tenant_id: str, query: str, vector: list, limit: int = 10):
        self._lazy_init()
        if not self.client: return []
        body = {
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": [{"match": {"text": query}}],
                            "filter": [{"term": {"tenant_id": tenant_id}}]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embeddings') + 1.0",
                        "params": {"query_vector": vector}
                    }
                }
            },
            "size": limit,
            "highlight": {
                "fields": {"text": {}},
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        }
        try:
            res = self.client.search(index=self.index_name, body=body)
            results = []
            for hit in res["hits"]["hits"]:
                source = hit["_source"]
                if "highlight" in hit and "text" in hit["highlight"]:
                    source["highlight"] = hit["highlight"]["text"]
                results.append(source)
            return results
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            return []

es_client = ESClient()
