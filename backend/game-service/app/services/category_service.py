from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.category import Category, CategoryType
from app.schemas.category import CategoryCreate


class CategoryService:
    @staticmethod
    def get_categories(db: Session, user_id: int | None = None, category_type: CategoryType | None = None) -> list[Category]:
        """Получить категории: глобальные + пользовательские"""
        query = db.query(Category).filter(
            or_(Category.user_id == user_id, Category.user_id.is_(None))
        )
        
        if category_type:
            query = query.filter(Category.type == category_type)
        
        return query.order_by(Category.user_id.desc(), Category.name).all()
    
    @staticmethod
    def get_category_by_id(db: Session, category_id: int, user_id: int) -> Category:
        """Получить категорию по ID (только если она глобальная или принадлежит пользователю)"""
        category = db.query(Category).filter(
            Category.id == category_id,
            or_(Category.user_id == user_id, Category.user_id.is_(None))
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category
    
    @staticmethod
    def create_category(db: Session, user_id: int, category_data: CategoryCreate) -> Category:
        """Создать пользовательскую категорию"""
        # Проверяем, нет ли уже такой категории у пользователя
        existing = db.query(Category).filter(
            Category.user_id == user_id,
            Category.name == category_data.name,
            Category.type == category_data.type
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Категория '{category_data.name}' уже существует. Выберите её из списка или введите другое название."
            )
        
        category = Category(
            user_id=user_id,
            name=category_data.name,
            type=category_data.type
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: int) -> None:
        """Удалить пользовательскую категорию (только свою)"""
        category = db.query(Category).filter(
            Category.id == category_id,
            Category.user_id == user_id
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or you don't have permission to delete it"
            )
        
        db.delete(category)
        db.commit()

