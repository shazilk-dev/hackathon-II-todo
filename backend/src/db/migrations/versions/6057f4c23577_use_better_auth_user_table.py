"""use_better_auth_user_table

Revision ID: 6057f4c23577
Revises: 0ccd40e90d3b
Create Date: 2026-01-16 09:57:18.988070

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6057f4c23577'
down_revision: Union[str, Sequence[str], None] = '0ccd40e90d3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Update tasks table to reference Better Auth's 'user' table.

    Establishes single source of truth for user data by pointing
    the foreign key to Better Auth's user table instead of the
    duplicate 'users' table.
    """
    # Drop existing foreign key constraint
    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')

    # Create new foreign key referencing Better Auth's 'user' table
    op.create_foreign_key(
        'tasks_user_id_fkey',  # constraint name
        'tasks',  # source table
        'user',  # target table (Better Auth's table)
        ['user_id'],  # source column
        ['id'],  # target column
        ondelete='CASCADE'  # Delete tasks when user is deleted
    )


def downgrade() -> None:
    """
    Revert to using the duplicate 'users' table.

    WARNING: This requires manual data sync between 'user' and 'users' tables.
    """
    # Drop Better Auth user table constraint
    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')

    # Recreate old constraint referencing duplicate users table
    op.create_foreign_key(
        'tasks_user_id_fkey',
        'tasks',
        'users',  # Old duplicate table
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )
