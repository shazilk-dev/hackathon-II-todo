#!/usr/bin/env python3
"""
Fix Alembic version table to update old invalid revision ID.

This script updates the alembic_version table to replace the invalid
revision ID 'b9c2d3e4f5g6' with the corrected 'b9c2d3e4f5f6'.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_alembic_version():
    # Parse DATABASE_URL to get connection params
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in .env")
        return

    # Convert asyncpg URL to standard postgres URL for asyncpg
    postgres_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    print(f"Connecting to Neon database...")

    try:
        # Connect to database
        conn = await asyncpg.connect(postgres_url)

        # Check current version
        current_version = await conn.fetchval("SELECT version_num FROM alembic_version")
        print(f"Current Alembic version: {current_version}")

        if current_version == "b9c2d3e4f5g6":
            print("Found invalid revision ID! Updating...")

            # Update to correct version
            await conn.execute(
                "UPDATE alembic_version SET version_num = 'b9c2d3e4f5f6' WHERE version_num = 'b9c2d3e4f5g6'"
            )

            # Verify update
            new_version = await conn.fetchval("SELECT version_num FROM alembic_version")
            print(f"[SUCCESS] Updated Alembic version to: {new_version}")
            print("Migration version fixed successfully!")

        elif current_version == "b9c2d3e4f5f6":
            print("[SUCCESS] Alembic version is already correct!")

        else:
            print(f"Current version is {current_version} (neither old nor new)")
            print("You may need to manually inspect the migration chain.")

        await conn.close()

    except Exception as e:
        print(f"ERROR: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(fix_alembic_version())
