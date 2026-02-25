from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from typing import Tuple


class TransactionService:
    @staticmethod
    def create_transaction(
        db: Session,
        user_id: int,
        transaction_data: TransactionCreate
    ) -> Transaction:
        transaction = Transaction(
            user_id=user_id,
            type=transaction_data.type,
            amount=transaction_data.amount,
            description=transaction_data.description
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

    @staticmethod
    def get_user_transactions(
        db: Session,
        user_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[list[Transaction], int]:
        offset = (page - 1) * page_size
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(desc(Transaction.created_at)).offset(offset).limit(page_size).all()

        total = db.query(Transaction).filter(Transaction.user_id == user_id).count()

        return transactions, total
