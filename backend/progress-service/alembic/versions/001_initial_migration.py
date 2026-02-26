"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'transactions' not in existing_tables:
        op.create_table(
            'transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(), nullable=False),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_foreign_key(
            'fk_transactions_user_id',
            'transactions',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )
        op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
        op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
        op.create_index(op.f('ix_transactions_created_at'), 'transactions', ['created_at'], unique=False)

    if 'quests' not in existing_tables:
        op.create_table(
            'quests',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('difficulty', sa.String(), nullable=False),
            sa.Column('reward_xp', sa.Integer(), nullable=False, server_default='0'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quests_id'), 'quests', ['id'], unique=False)

    if 'quest_progress' not in existing_tables:
        op.create_table(
            'quest_progress',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('quest_id', sa.Integer(), nullable=False),
            sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['quest_id'], ['quests.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quest_progress_id'), 'quest_progress', ['id'], unique=False)
        op.create_index(op.f('ix_quest_progress_user_id'), 'quest_progress', ['user_id'], unique=False)
        op.create_index(op.f('ix_quest_progress_quest_id'), 'quest_progress', ['quest_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quest_progress_quest_id'), table_name='quest_progress')
    op.drop_index(op.f('ix_quest_progress_user_id'), table_name='quest_progress')
    op.drop_index(op.f('ix_quest_progress_id'), table_name='quest_progress')
    op.drop_table('quest_progress')
    op.drop_index(op.f('ix_quests_id'), table_name='quests')
    op.drop_table('quests')
    op.drop_index(op.f('ix_transactions_created_at'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_table('transactions')
