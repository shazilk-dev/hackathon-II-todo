"""add_tags_and_task_tags_tables

Revision ID: 4de547558a7d
Revises: f000f9c46c21
Create Date: 2026-01-28 14:00:52.195281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4de547558a7d'
down_revision: Union[str, Sequence[str], None] = 'f000f9c46c21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create tags and task_tags tables for many-to-many relationship.

    - tags: stores user-defined tags with names and colors
    - task_tags: junction table for task-tag associations
    - Unique constraint: (user_id, name) for tag deduplication per user
    """
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_tag_name')
    )

    # Create indexes for tags
    op.create_index('ix_tags_user_id', 'tags', ['user_id'])
    op.create_index('ix_tags_name', 'tags', ['name'])

    # Create task_tags junction table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    # Create indexes for task_tags
    op.create_index('ix_task_tags_task_id', 'task_tags', ['task_id'])
    op.create_index('ix_task_tags_tag_id', 'task_tags', ['tag_id'])


def downgrade() -> None:
    """
    Remove tags and task_tags tables.
    """
    # Drop task_tags table and indexes
    op.drop_index('ix_task_tags_tag_id', 'task_tags')
    op.drop_index('ix_task_tags_task_id', 'task_tags')
    op.drop_table('task_tags')

    # Drop tags table and indexes
    op.drop_index('ix_tags_name', 'tags')
    op.drop_index('ix_tags_user_id', 'tags')
    op.drop_table('tags')
