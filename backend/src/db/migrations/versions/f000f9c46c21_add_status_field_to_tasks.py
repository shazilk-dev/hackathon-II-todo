"""add_status_field_to_tasks

Revision ID: f000f9c46c21
Revises: 107075eb278c
Create Date: 2026-01-28 13:48:34.520961

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f000f9c46c21'
down_revision: Union[str, Sequence[str], None] = '107075eb278c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add status column to tasks table and migrate existing data.

    - Add status column with CHECK constraint (backlog, in_progress, blocked, done)
    - Migrate existing data: completed=True → 'done', completed=False → 'backlog'
    - Keep completed column for Phase 2 transition (will be dropped in Phase 3)
    - Add index on status for filtering performance
    """
    # Add status column with default value
    op.add_column(
        'tasks',
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            server_default='backlog'
        )
    )

    # Migrate existing data: completed=True → 'done', completed=False → 'backlog'
    op.execute(
        """
        UPDATE tasks
        SET status = CASE
            WHEN completed = true THEN 'done'
            ELSE 'backlog'
        END
        """
    )

    # Add CHECK constraint to validate status values
    op.create_check_constraint(
        'check_status_valid',
        'tasks',
        "status IN ('backlog', 'in_progress', 'blocked', 'done')"
    )

    # Create index for filtering by status
    op.create_index('ix_tasks_status', 'tasks', ['status'])


def downgrade() -> None:
    """
    Remove status column from tasks table.

    Note: This will lose status information for tasks that were in_progress or blocked.
    Completed field is preserved as the source of truth.
    """
    # Drop index
    op.drop_index('ix_tasks_status', 'tasks')

    # Drop CHECK constraint
    op.drop_constraint('check_status_valid', 'tasks', type_='check')

    # Drop status column
    op.drop_column('tasks', 'status')
