"""add_focus_sessions_table

Revision ID: b9c2d3e4f5g6
Revises: a8b9c1d2e3f4
Create Date: 2026-01-28 16:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9c2d3e4f5g6'
down_revision: Union[str, Sequence[str], None] = 'a8b9c1d2e3f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create focus_sessions table for tracking Pomodoro timer sessions.

    This table logs each focus session when user works on a task in focus mode.
    Tracks:
    - Which task was focused on
    - Session duration (25min, 15min, or 5min)
    - Whether session was completed or interrupted
    - Notes added during session
    """
    op.create_table(
        'focus_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),  # 25, 15, or 5
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('duration_minutes IN (5, 15, 25)', name='check_duration_valid')
    )

    # Create indexes for efficient querying
    op.create_index('ix_focus_sessions_user_id', 'focus_sessions', ['user_id'])
    op.create_index('ix_focus_sessions_task_id', 'focus_sessions', ['task_id'])
    op.create_index('ix_focus_sessions_started_at', 'focus_sessions', ['started_at'])


def downgrade() -> None:
    """
    Remove focus_sessions table and indexes.
    """
    op.drop_index('ix_focus_sessions_started_at', 'focus_sessions')
    op.drop_index('ix_focus_sessions_task_id', 'focus_sessions')
    op.drop_index('ix_focus_sessions_user_id', 'focus_sessions')
    op.drop_table('focus_sessions')
