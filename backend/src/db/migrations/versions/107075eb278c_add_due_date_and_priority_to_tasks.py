"""add_due_date_and_priority_to_tasks

Revision ID: 107075eb278c
Revises: 6057f4c23577
Create Date: 2026-01-28 13:30:15.403678

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '107075eb278c'
down_revision: Union[str, Sequence[str], None] = '6057f4c23577'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add due_date and priority columns to tasks table.

    - due_date: nullable DateTime for task deadlines
    - priority: varchar(10) with CHECK constraint (low, medium, high, critical)
    - Indexes on both columns for filtering/sorting performance
    """
    # Add due_date column (nullable)
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(), nullable=True))

    # Add priority column with default value
    op.add_column(
        'tasks',
        sa.Column(
            'priority',
            sa.String(10),
            nullable=False,
            server_default='medium'
        )
    )

    # Create indexes for filtering and sorting
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])
    op.create_index('ix_tasks_priority', 'tasks', ['priority'])

    # Add CHECK constraint to validate priority values
    op.create_check_constraint(
        'check_priority_valid',
        'tasks',
        "priority IN ('low', 'medium', 'high', 'critical')"
    )


def downgrade() -> None:
    """
    Remove due_date and priority columns from tasks table.
    """
    # Drop CHECK constraint
    op.drop_constraint('check_priority_valid', 'tasks', type_='check')

    # Drop indexes
    op.drop_index('ix_tasks_priority', 'tasks')
    op.drop_index('ix_tasks_due_date', 'tasks')

    # Drop columns
    op.drop_column('tasks', 'priority')
    op.drop_column('tasks', 'due_date')
