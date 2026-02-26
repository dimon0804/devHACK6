"""Add categories table

Revision ID: 002_add_categories
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_categories'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    
    # Check if table already exists
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'categories'
        );
    """))
    table_exists = result.scalar()
    
    if table_exists:
        # Table already exists, skip migration
        return
    
    # Create table with String type and CHECK constraint (no ENUM needed)
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], use_alter=True),
        sa.CheckConstraint("type IN ('income', 'expense', 'savings')", name='check_category_type'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)
    
    # Insert global categories
    op.execute("""
        INSERT INTO categories (user_id, name, type) VALUES
        (NULL, 'Еда', 'expense'),
        (NULL, 'Транспорт', 'expense'),
        (NULL, 'Развлечения', 'expense'),
        (NULL, 'Одежда', 'expense'),
        (NULL, 'Здоровье', 'expense'),
        (NULL, 'Образование', 'expense'),
        (NULL, 'Коммунальные услуги', 'expense'),
        (NULL, 'Подарки', 'expense'),
        (NULL, 'Зарплата', 'income'),
        (NULL, 'Подарки', 'income'),
        (NULL, 'Прочие доходы', 'income'),
        (NULL, 'Накопления', 'savings'),
        (NULL, 'Инвестиции', 'savings')
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_categories_user_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')

