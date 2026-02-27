"""Initial migration for analytics service

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-15 00:00:00.000000

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
    # Create analytics_events table
    op.create_table(
        'analytics_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_category', sa.String(), nullable=True),
        sa.Column('event_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_events_id'), 'analytics_events', ['id'], unique=False)
    op.create_index(op.f('ix_analytics_events_event_type'), 'analytics_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_analytics_events_event_category'), 'analytics_events', ['event_category'], unique=False)
    op.create_index(op.f('ix_analytics_events_created_at'), 'analytics_events', ['created_at'], unique=False)

    # Create analytics_aggregates table
    op.create_table(
        'analytics_aggregates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(), nullable=False),
        sa.Column('metric_category', sa.String(), nullable=True),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metric_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_aggregates_id'), 'analytics_aggregates', ['id'], unique=False)
    op.create_index(op.f('ix_analytics_aggregates_metric_name'), 'analytics_aggregates', ['metric_name'], unique=False)
    op.create_index(op.f('ix_analytics_aggregates_metric_category'), 'analytics_aggregates', ['metric_category'], unique=False)
    op.create_index(op.f('ix_analytics_aggregates_period_start'), 'analytics_aggregates', ['period_start'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_analytics_aggregates_period_start'), table_name='analytics_aggregates')
    op.drop_index(op.f('ix_analytics_aggregates_metric_category'), table_name='analytics_aggregates')
    op.drop_index(op.f('ix_analytics_aggregates_metric_name'), table_name='analytics_aggregates')
    op.drop_index(op.f('ix_analytics_aggregates_id'), table_name='analytics_aggregates')
    op.drop_table('analytics_aggregates')
    op.drop_index(op.f('ix_analytics_events_created_at'), table_name='analytics_events')
    op.drop_index(op.f('ix_analytics_events_event_category'), table_name='analytics_events')
    op.drop_index(op.f('ix_analytics_events_event_type'), table_name='analytics_events')
    op.drop_index(op.f('ix_analytics_events_id'), table_name='analytics_events')
    op.drop_table('analytics_events')
