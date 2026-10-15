import requests
from .resources.documents import Documents
from .resources.search import Search
from .resources.rag import RAG

class Client:
    def __init__(self, api_key: str, base_url: str = "https://api.yourplatform.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})
        
        self.documents = Documents(self)
        self.search = Search(self)
        self.rag = RAG(self)
