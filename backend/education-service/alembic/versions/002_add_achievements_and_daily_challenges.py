"""Add achievements and daily challenges

Revision ID: 002_achievements
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_achievements'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create achievements table
    op.create_table(
        'achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('condition', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_achievements_id'), 'achievements', ['id'], unique=False)

    # Create user_achievements table
    op.create_table(
        'user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('achievement_id', sa.Integer(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_user_achievements_user_id'), 'user_achievements', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_achievements_achievement_id'), 'user_achievements', ['achievement_id'], unique=False)

    # Create daily_challenges table
    op.create_table(
        'daily_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('challenge_date', sa.Date(), nullable=False),
        sa.Column('xp_reward', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('condition', sa.String(length=100), nullable=False),
        sa.Column('condition_value', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_challenges_id'), 'daily_challenges', ['id'], unique=False)
    op.create_index(op.f('ix_daily_challenges_challenge_date'), 'daily_challenges', ['challenge_date'], unique=True)

    # Create user_daily_challenges table
    op.create_table(
        'user_daily_challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['challenge_id'], ['daily_challenges.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_user_daily_challenges_user_id'), 'user_daily_challenges', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_daily_challenges_challenge_id'), 'user_daily_challenges', ['challenge_id'], unique=False)

    # Insert initial achievements
    op.execute("""
        INSERT INTO achievements (title, description, icon, condition) VALUES
        ('Первый бюджет', 'Создал свой первый план бюджета', '📋', '{"type": "first_budget"}'),
        ('Накопил 10 000', 'Накопил 10 000 рублей', '💰', '{"type": "savings_amount", "amount": 10000}'),
        ('5 дней подряд', 'Планировал бюджет 5 дней подряд', '🔥', '{"type": "planning_streak", "days": 5}'),
        ('Прошёл 3 квиза', 'Пройдено 3 обучающих квиза', '🎓', '{"type": "quizzes_completed", "count": 3}')
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_daily_challenges_challenge_id'), table_name='user_daily_challenges')
    op.drop_index(op.f('ix_user_daily_challenges_user_id'), table_name='user_daily_challenges')
    op.drop_table('user_daily_challenges')
    
    op.drop_index(op.f('ix_daily_challenges_challenge_date'), table_name='daily_challenges')
    op.drop_index(op.f('ix_daily_challenges_id'), table_name='daily_challenges')
    op.drop_table('daily_challenges')
    
    op.drop_index(op.f('ix_user_achievements_achievement_id'), table_name='user_achievements')
    op.drop_index(op.f('ix_user_achievements_user_id'), table_name='user_achievements')
    op.drop_table('user_achievements')
    
    op.drop_index(op.f('ix_achievements_id'), table_name='achievements')
    op.drop_table('achievements')
