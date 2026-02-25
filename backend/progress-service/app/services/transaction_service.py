from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from app.schemas.transaction import TransactionCreate
from typing import Tuple


class TransactionService:
    @staticmethod
    def create_transaction(
        db: Session,
        user_id: int,
        transaction_data: TransactionCreate
    ) -> dict:
        try:
            print(f"Creating transaction for user {user_id}: type={transaction_data.type}, amount={transaction_data.amount}")
            # Use direct connection to avoid SQLAlchemy session validation
            from sqlalchemy import text
            from decimal import Decimal
            from app.core.database import engine
            from datetime import datetime
            
            # Use engine connection directly, not session
            with engine.connect() as conn:
                result = conn.execute(
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
                conn.commit()
                row = result.fetchone()
            
            # Return dict instead of ORM object to avoid SQLAlchemy validation
            created_at = row[5]
            if not isinstance(created_at, datetime):
                try:
                    created_at = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
                except:
                    created_at = datetime.now()
            
            transaction_dict = {
                "id": row[0],
                "user_id": row[1],
                "type": row[2],
                "amount": Decimal(str(row[3])),
                "description": row[4],
                "created_at": created_at
            }
            print(f"Transaction created successfully: id={transaction_dict['id']}")
            return transaction_dict
        except Exception as e:
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
    ) -> Tuple[list[dict], int]:
        from sqlalchemy import text
        from decimal import Decimal
        from datetime import datetime
        from app.core.database import engine
        
        offset = (page - 1) * page_size
        
        # Use direct connection to avoid SQLAlchemy session validation
        with engine.connect() as conn:
            transactions_result = conn.execute(
                text("""
                    SELECT id, user_id, type, amount, description, created_at
                    FROM transactions
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"user_id": user_id, "limit": page_size, "offset": offset}
            )
            
            total_result = conn.execute(
                text("SELECT COUNT(*) FROM transactions WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
            total = total_result.scalar()
            
            # Return dictionaries instead of ORM objects to avoid SQLAlchemy validation
            transactions = []
            for row in transactions_result:
                created_at = row[5]
                if not isinstance(created_at, datetime):
                    try:
                        created_at = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
                    except:
                        created_at = datetime.now()
                
                transactions.append({
                    "id": row[0],
                    "user_id": row[1],
                    "type": row[2],
                    "amount": Decimal(str(row[3])),
                    "description": row[4],
                    "created_at": created_at
                })

        return transactions, total
