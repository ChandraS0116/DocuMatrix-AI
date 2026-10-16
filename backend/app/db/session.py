import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

from app.models.database import Base

# Accept either POSTGRES_URL or DATABASE_URL
DB_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or "postgresql://user:password@localhost:5432/docintel"

engine = None
SessionLocal = None

def _check_postgres_alive(url: str) -> bool:
    import socket
    try:
        host = "127.0.0.1"
        port = 5432
        if "@" in url:
            parts = url.split("@")[1].split("/")[0]
            if ":" in parts:
                host, port = parts.split(":")[0], int(parts.split(":")[1])
            else:
                host = parts
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.2)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False

# Attempt PostgreSQL connection if available
if os.getenv("USE_SQLITE", "").lower() != "true" and _check_postgres_alive(DB_URL):
    try:
        candidate_engine = create_engine(
            DB_URL, 
            pool_pre_ping=True, 
            pool_size=20, 
            max_overflow=10,
            pool_timeout=2,
            pool_recycle=1800,
            connect_args={"connect_timeout": 2}
        )
        with candidate_engine.connect() as conn:
            pass
        engine = candidate_engine
        SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        logger.info("Connected to PostgreSQL database.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}), falling back to embedded SQLite database.")

# If PostgreSQL is not available, use embedded SQLite database
if engine is None:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sqlite_path = os.path.join(backend_dir, "docintel_local.db")
    engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    logger.info(f"Using SQLite database at {sqlite_path}")

def init_db():
    """Create all tables if connected to real engine"""
    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables verified/created successfully.")
        except Exception as ex:
            logger.error(f"Failed to create database tables: {ex}")

# Ensure tables are initialized
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

