import os
import logging
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional

try:
    import jwt
except ImportError:
    try:
        from jose import jwt
    except ImportError:
        jwt = None

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "documatrix-production-secret-key-replace-in-production-vault")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token", auto_error=False)

class User(BaseModel):
    username: str
    tenant_id: str
    roles: List[str]

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    if not jwt:
        raise HTTPException(status_code=500, detail="PyJWT is not installed on server.")
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Validates JWT token and extracts tenant_id and roles.
    In development environments, permits a controlled dev_user fallback.
    """
    is_empty_token = (
        not token 
        or not isinstance(token, str) 
        or token.strip().lower() in ["", "null", "undefined", "bearer", "none"]
    )
    dev_mode = os.getenv("DOCINTEL_MODE", "DEV").upper() in ["DEV", "DEVELOPMENT"] or os.getenv("ALLOW_DEV_AUTH", "true").lower() == "true"

    if is_empty_token:
        if dev_mode:
            return User(username="dev_user", tenant_id="default", roles=["TENANT_ADMIN", "OPERATOR", "VIEWER"])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not jwt:
        if dev_mode:
            return User(username="dev_user", tenant_id="default", roles=["TENANT_ADMIN", "OPERATOR", "VIEWER"])
        logger.error("JWT validation attempted but PyJWT library is missing.")
        raise HTTPException(status_code=500, detail="JWT module not available on server")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub") or payload.get("username")
        tenant_id: str = payload.get("tenant_id") or "default"
        roles: List[str] = payload.get("roles", ["VIEWER"])
        
        if username is None:
            if dev_mode:
                return User(username="dev_user", tenant_id="default", roles=["TENANT_ADMIN", "OPERATOR", "VIEWER"])
            raise HTTPException(status_code=401, detail="Invalid authentication token payload")
            
        return User(username=username, tenant_id=tenant_id, roles=roles)
    except Exception as e:
        if dev_mode:
            logger.info(f"Dev auth fallback for token ({e})")
            return User(username="dev_user", tenant_id="default", roles=["TENANT_ADMIN", "OPERATOR", "VIEWER"])
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_token(token: str) -> dict:
    """Verifies a JWT token and returns decoded payload dictionary."""
    if not jwt:
        raise HTTPException(status_code=500, detail="PyJWT is not installed on server.")
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

