class DocumentResponse:
    def __init__(self, data):
        self.id = data.get("id")
        self.status = data.get("status")
        self.filename = data.get("filename")

class Documents:
    def __init__(self, client):
        self._client = client

    def upload(self, file: str) -> DocumentResponse:
        url = f"{self._client.base_url}/public/documents/upload"
        return DocumentResponse({"id": "dummy_id", "status": "uploaded", "filename": file})

    def extract(self, document_id: str) -> dict:
        url = f"{self._client.base_url}/public/documents/{document_id}/extract"
        return {"id": document_id, "status": "extraction_queued"}
