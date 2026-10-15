import logging
from typing import Dict, Any, List
from app.services.rag.embeddings import embedding_generator
from app.services.search.elasticsearch_client import es_client
from app.services.rag.reranker import reranker
from app.services.rag.safety import RagSafetyLayer
from app.services.llm.provider import llm_provider

logger = logging.getLogger(__name__)

class RagOrchestrator:
    def semantic_search(self, query: str, tenant_id: str, top_k: int = 20) -> list:
        # 1. Embed query using real embedding generator
        emb_result = embedding_generator.generate(query, tenant_id=tenant_id)
        vector = emb_result.get("vector", [])
        
        # 2. Search using Elasticsearch client
        if vector:
            results = es_client.hybrid_search(tenant_id=tenant_id, query=query, vector=vector, limit=top_k)
        else:
            results = es_client.search_documents(tenant_id=tenant_id, query=query, limit=top_k)
            
        return results
        
    def ask(self, query: str, tenant_id: str) -> Dict[str, Any]:
        # 1. Retrieve top chunks (Tenant Scoped)
        top_chunks = self.semantic_search(query, tenant_id=tenant_id, top_k=20)
        
        # 2. Rerank top 5
        top_5_chunks = reranker.rerank(query, top_chunks, top_k=5) if top_chunks else []
        
        # 3. Sanitize and inject into prompt
        context_blocks = []
        citations = []
        for chunk in top_5_chunks:
            text = chunk.get("text") or chunk.get("searchable_text") or ""
            doc_id = chunk.get("document_id") or "doc_ref"
            safe_context = RagSafetyLayer.wrap_trusted_context(text, doc_id)
            context_blocks.append(safe_context)
            
            citations.append({
                "chunk_id": chunk.get("chunk_id") or f"{doc_id}_chunk",
                "document_id": doc_id,
                "text": text[:200] + "..." if len(text) > 200 else text,
                "relevance_score": chunk.get("score") or 0.95,
                "source_type": chunk.get("document_type") or "Document",
                "page_number": chunk.get("page_number", 1)
            })
            
        context_str = "\n".join(context_blocks) if context_blocks else "No matching document chunks found in index for this tenant."
        system_prompt = "You are DocuMatrix AI, an Enterprise Document Intelligence assistant. Answer accurately based on the TRUSTED_CONTEXT provided."
        full_prompt = f"{system_prompt}\n\nContext:\n{context_str}\n\nQuery: {query}\nAnswer:"
        
        # 4. Generate answer using real LLM provider
        answer = llm_provider.generate(full_prompt)
        
        # 5. Return Citation-First payload
        return {
            "query": query,
            "answer": answer,
            "citations": citations,
            "chunks_retrieved": len(top_chunks)
        }

rag_orchestrator = RagOrchestrator()
