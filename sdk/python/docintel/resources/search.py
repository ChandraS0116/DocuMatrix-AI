class Search:
    def __init__(self, client):
        self._client = client

    def query(self, text: str, limit: int = 10) -> list:
        url = f"{self._client.base_url}/public/search/query"
        return []
