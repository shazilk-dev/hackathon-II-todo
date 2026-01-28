"""add_task_completions_table

Revision ID: a8b9c1d2e3f4
Revises: 4de547558a7d
Create Date: 2026-01-28 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8b9c1d2e3f4'
down_revision: Union[str, Sequence[str], None] = '4de547558a7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create task_completions table for tracking completion history and streaks.

    This table logs each time a task is completed (transitions to done status).
    Used for calculating:
    - Task completion statistics
    - Daily streaks (consecutive days with completions)
    - Weekly completion charts
    """
    op.create_table(
        'task_completions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for efficient querying
    op.create_index('ix_task_completions_user_id', 'task_completions', ['user_id'])
    op.create_index('ix_task_completions_task_id', 'task_completions', ['task_id'])
    op.create_index('ix_task_completions_completed_at', 'task_completions', ['completed_at'])

    # Composite index for user + date queries (for streak calculation)
    op.create_index('ix_task_completions_user_date', 'task_completions', ['user_id', 'completed_at'])


def downgrade() -> None:
    """
    Remove task_completions table and indexes.
    """
    op.drop_index('ix_task_completions_user_date', 'task_completions')
    op.drop_index('ix_task_completions_completed_at', 'task_completions')
    op.drop_index('ix_task_completions_task_id', 'task_completions')
    op.drop_index('ix_task_completions_user_id', 'task_completions')
    op.drop_table('task_completions')
