"""
Service layer for tag management operations.

Implements business logic for creating tags and associating them with tasks.
All methods enforce user data isolation.
"""

from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.tag import Tag, TaskTag
from src.schemas.tag import TagCreate


class TagService:
    """
    Service for tag management operations.

    All methods are static and require an async database session.
    Enforces user isolation - users can only access their own tags.
    """

    @staticmethod
    async def get_user_tags(
        session: AsyncSession,
        user_id: str,
    ) -> List[Tag]:
        """
        Get all tags for a user.

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)

        Returns:
            List of tags for the user
        """
        statement = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())
        result = await session.execute(statement)
        return list(result.scalars().all())

    @staticmethod
    async def get_or_create_tag(
        session: AsyncSession,
        user_id: str,
        tag_data: TagCreate,
    ) -> Tag:
        """
        Get existing tag or create a new one (deduplication per user).

        Args:
            session: Async database session
            user_id: ID of the user (from JWT)
            tag_data: Tag creation data

        Returns:
            Existing or newly created tag
        """
        # Try to find existing tag with same name for this user
        statement = select(Tag).where(
            Tag.user_id == user_id,
            Tag.name == tag_data.name
        )
        result = await session.execute(statement)
        existing_tag = result.scalar_one_or_none()

        if existing_tag:
            # Update color if different
            if existing_tag.color != tag_data.color:
                existing_tag.color = tag_data.color
                session.add(existing_tag)
                await session.commit()
                await session.refresh(existing_tag)
            return existing_tag

        # Create new tag
        tag = Tag(
            user_id=user_id,
            name=tag_data.name,
            color=tag_data.color,
        )
        session.add(tag)
        await session.commit()
        await session.refresh(tag)
        return tag

    @staticmethod
    async def add_tags_to_task(
        session: AsyncSession,
        task_id: int,
        tag_ids: List[int],
    ) -> None:
        """
        Associate tags with a task (replaces existing associations).

        Args:
            session: Async database session
            task_id: ID of the task
            tag_ids: List of tag IDs to associate with the task
        """
        # Remove existing associations
        delete_statement = select(TaskTag).where(TaskTag.task_id == task_id)
        result = await session.execute(delete_statement)
        existing_associations = result.scalars().all()
        for association in existing_associations:
            await session.delete(association)

        # Add new associations
        for tag_id in tag_ids:
            task_tag = TaskTag(task_id=task_id, tag_id=tag_id)
            session.add(task_tag)

        await session.commit()

    @staticmethod
    async def get_task_tags(
        session: AsyncSession,
        task_id: int,
    ) -> List[Tag]:
        """
        Get all tags for a task.

        Args:
            session: Async database session
            task_id: ID of the task

        Returns:
            List of tags for the task
        """
        statement = (
            select(Tag)
            .join(TaskTag, TaskTag.tag_id == Tag.id)
            .where(TaskTag.task_id == task_id)
            .order_by(Tag.name.asc())
        )
        result = await session.execute(statement)
        return list(result.scalars().all())
