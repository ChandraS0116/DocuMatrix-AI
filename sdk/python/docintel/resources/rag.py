class RAG:
    def __init__(self, client):
        self._client = client

    def query(self, question: str) -> str:
        url = f"{self._client.base_url}/public/rag/query"
        return "Generated answer based on enterprise context"
