from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import verify_token
from app.services.transaction_service import TransactionService
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionListResponse

router = APIRouter()


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    token = authorization.split(" ")[1]
    user_data = await verify_token(token)
    return user_data["id"]


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    transaction_dict = TransactionService.create_transaction(db, user_id, transaction_data)
    # Convert dict to TransactionResponse
    from app.schemas.transaction import TransactionResponse
    return TransactionResponse(**transaction_dict)


@router.get("", response_model=TransactionListResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    transactions_dict, total = TransactionService.get_user_transactions(
        db, user_id, page, page_size
    )
    # Convert dicts to TransactionResponse objects
    from app.schemas.transaction import TransactionResponse
    transactions = [TransactionResponse(**tx) for tx in transactions_dict]
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "page_size": page_size
    }
