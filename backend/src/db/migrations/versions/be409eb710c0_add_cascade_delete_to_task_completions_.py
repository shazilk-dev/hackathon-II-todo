"""add cascade delete to task_completions and focus_sessions FKs

Revision ID: be409eb710c0
Revises: 3451e5a5cdef
Create Date: 2026-02-06 17:22:10.789974

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'be409eb710c0'
down_revision: Union[str, Sequence[str], None] = '3451e5a5cdef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    NOTE: Better Auth tables (account, session, verification) are managed
    externally by the frontend and must NOT be touched by Alembic.
    """
    # Add CASCADE to focus_sessions FKs
    op.drop_constraint(op.f('focus_sessions_user_id_fkey'), 'focus_sessions', type_='foreignkey')
    op.drop_constraint(op.f('focus_sessions_task_id_fkey'), 'focus_sessions', type_='foreignkey')
    op.create_foreign_key(None, 'focus_sessions', 'user', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'focus_sessions', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')

    # Add CASCADE to tags FK
    op.drop_constraint(op.f('tags_user_id_fkey'), 'tags', type_='foreignkey')
    op.create_foreign_key(None, 'tags', 'user', ['user_id'], ['id'], ondelete='CASCADE')

    # Add CASCADE to task_completions FKs
    op.drop_constraint(op.f('task_completions_task_id_fkey'), 'task_completions', type_='foreignkey')
    op.drop_constraint(op.f('task_completions_user_id_fkey'), 'task_completions', type_='foreignkey')
    op.create_foreign_key(None, 'task_completions', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'task_completions', 'user', ['user_id'], ['id'], ondelete='CASCADE')

    # Add CASCADE to task_tags FKs
    op.drop_constraint(op.f('task_tags_task_id_fkey'), 'task_tags', type_='foreignkey')
    op.drop_constraint(op.f('task_tags_tag_id_fkey'), 'task_tags', type_='foreignkey')
    op.create_foreign_key(None, 'task_tags', 'tags', ['tag_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'task_tags', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')

    # Add composite indexes on tasks
    op.create_index('ix_tasks_user_completed', 'tasks', ['user_id', 'completed'], unique=False)
    op.create_index('ix_tasks_user_duedate', 'tasks', ['user_id', 'due_date'], unique=False)
    op.create_index('ix_tasks_user_status', 'tasks', ['user_id', 'status'], unique=False)

    # Add CASCADE to tasks FK
    op.drop_constraint(op.f('tasks_user_id_fkey'), 'tasks', type_='foreignkey')
    op.create_foreign_key(None, 'tasks', 'user', ['user_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema.

    NOTE: Better Auth tables (account, session, verification) are NOT touched.
    """
    # Revert tasks FK
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.create_foreign_key(op.f('tasks_user_id_fkey'), 'tasks', 'user', ['user_id'], ['id'])

    # Drop composite indexes on tasks
    op.drop_index('ix_tasks_user_status', table_name='tasks')
    op.drop_index('ix_tasks_user_duedate', table_name='tasks')
    op.drop_index('ix_tasks_user_completed', table_name='tasks')

    # Revert task_tags FKs
    op.drop_constraint(None, 'task_tags', type_='foreignkey')
    op.drop_constraint(None, 'task_tags', type_='foreignkey')
    op.create_foreign_key(op.f('task_tags_tag_id_fkey'), 'task_tags', 'tags', ['tag_id'], ['id'])
    op.create_foreign_key(op.f('task_tags_task_id_fkey'), 'task_tags', 'tasks', ['task_id'], ['id'])

    # Revert task_completions FKs
    op.drop_constraint(None, 'task_completions', type_='foreignkey')
    op.drop_constraint(None, 'task_completions', type_='foreignkey')
    op.create_foreign_key(op.f('task_completions_user_id_fkey'), 'task_completions', 'user', ['user_id'], ['id'])
    op.create_foreign_key(op.f('task_completions_task_id_fkey'), 'task_completions', 'tasks', ['task_id'], ['id'])

    # Revert tags FK
    op.drop_constraint(None, 'tags', type_='foreignkey')
    op.create_foreign_key(op.f('tags_user_id_fkey'), 'tags', 'user', ['user_id'], ['id'])

    # Revert focus_sessions FKs
    op.drop_constraint(None, 'focus_sessions', type_='foreignkey')
    op.drop_constraint(None, 'focus_sessions', type_='foreignkey')
    op.create_foreign_key(op.f('focus_sessions_task_id_fkey'), 'focus_sessions', 'tasks', ['task_id'], ['id'])
    op.create_foreign_key(op.f('focus_sessions_user_id_fkey'), 'focus_sessions', 'user', ['user_id'], ['id'])
