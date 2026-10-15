import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# Accept either POSTGRES_URL or DATABASE_URL
DB_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or "postgresql://user:password@localhost:5432/docintel"

engine = None
SessionLocal = None

try:
    engine = create_engine(
        DB_URL, 
        pool_pre_ping=True, 
        pool_size=20, 
        max_overflow=10,
        pool_timeout=5,
        pool_recycle=1800
    )
    # Test connection to ensure DB is reachable
    with engine.connect() as conn:
        pass
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
except Exception as e:
    if os.getenv("USE_MOCK_DB", "false").lower() == "true":
        logger.info("Using Mock DB as requested by USE_MOCK_DB=true.")
    else:
        logger.warning(f"Database unavailable ({e}), falling back to Mock DB.")
    engine = None
    
    class MockSession:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def execute(self, *args, **kwargs): return []
        def query(self, *args, **kwargs):
            class MockQuery:
                def filter(self, *args, **kwargs): return self
                def first(self): return None
                def all(self): return []
                def count(self): return 0
                def order_by(self, *args, **kwargs): return self
                def limit(self, *args, **kwargs): return self
            return MockQuery()
        def commit(self): pass
        def rollback(self): pass
        def close(self): pass
        def add(self, *args): pass
        def refresh(self, *args): pass

    def SessionLocal(*args, **kwargs):
        return MockSession()

# Import the canonical Base from models
from app.models.database import Base

def init_db():
    """Create all tables if connected to real engine"""
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables verified/created successfully.")
        except Exception as ex:
            logger.error(f"Failed to create database tables: {ex}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
