from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, TokenRefresh
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    user = AuthService.register_user(db, user_data)
    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, login_data)
    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/refresh", response_model=dict)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    tokens = AuthService.refresh_access_token(token_data.refresh_token, db)
    return tokens


@router.get("/me")
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user = AuthService.get_current_user(token, db)
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "level": user.level,
        "xp": user.xp,
        "balance": float(user.balance)
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    return AuthService.get_current_user(token, db)
