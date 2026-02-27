from fastapi import HTTPException, status, Depends, Header
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def verify_admin_token(authorization: str = Header(None)):
    """Verify admin token from Authorization header"""
    if not authorization:
        logger.warning("Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            logger.warning(f"Invalid authentication scheme: {scheme}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        logger.warning(f"Invalid authorization header format: {authorization}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Simple token check (in production, use JWT or proper auth)
    # Use print for immediate visibility
    print(f"[AUTH] Token check: received length={len(token)}, expected length={len(settings.ADMIN_SECRET_KEY)}")
    print(f"[AUTH] Token check: received={repr(token)}, expected={repr(settings.ADMIN_SECRET_KEY)}")
    print(f"[AUTH] Token match: {token == settings.ADMIN_SECRET_KEY}")
    
    logger.info(f"Token check: received length={len(token)}, expected length={len(settings.ADMIN_SECRET_KEY)}")
    logger.info(f"Token check: received={repr(token)}, expected={repr(settings.ADMIN_SECRET_KEY)}")
    
    if token != settings.ADMIN_SECRET_KEY:
        print(f"[AUTH] ERROR: Token mismatch!")
        logger.warning(f"Invalid admin token: received token does not match")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid admin token. Expected length: {len(settings.ADMIN_SECRET_KEY)}, received length: {len(token)}"
        )
    
    return token
