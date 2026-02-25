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
        try:
            print(f"Creating transaction for user {user_id}: type={transaction_data.type}, amount={transaction_data.amount}")
            # Use raw SQL to insert transaction to avoid SQLAlchemy foreign key validation
            from sqlalchemy import text
            from decimal import Decimal
            
            result = db.execute(
                text("""
                    INSERT INTO transactions (user_id, type, amount, description, created_at)
                    VALUES (:user_id, :type, :amount, :description, NOW())
                    RETURNING id, user_id, type, amount, description, created_at
                """),
                {
                    "user_id": user_id,
                    "type": transaction_data.type,
                    "amount": str(transaction_data.amount),
                    "description": transaction_data.description
                }
            )
            row = result.fetchone()
            db.commit()
            
            # Create Transaction object from row
            from datetime import datetime
            transaction = Transaction(
                id=row[0],
                user_id=row[1],
                type=row[2],
                amount=Decimal(str(row[3])),
                description=row[4],
                created_at=row[5] if isinstance(row[5], datetime) else datetime.fromisoformat(str(row[5]).replace('Z', '+00:00'))
            )
            print(f"Transaction created successfully: id={transaction.id}")
            return transaction
        except Exception as e:
            db.rollback()
            print(f"Error creating transaction: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create transaction: {str(e)}"
            )

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
