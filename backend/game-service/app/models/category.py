from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class CategoryType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    SAVINGS = "savings"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", use_alter=True), nullable=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("type IN ('income', 'expense', 'savings')", name="check_category_type"),
    )

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', type='{self.type}', user_id={self.user_id})>"

