#!/usr/bin/env python3
"""
Script to create a default admin user for testing the authentication system.
Run this script to create an admin user with email: admin@example.com and password: admin123
"""

import asyncio
import os
import sys

# Add project root to the path to allow imports from 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.core.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate
from app.database import AsyncSessionLocal
from app.config import settings

async def main():
    """Initializes the admin user in the database."""
    print("Attempting to initialize admin user...")
    db = AsyncSessionLocal()
    try:
        user = await get_user_by_email(db, email=settings.ADMIN_EMAIL)
        if not user:
            print(f"Admin user '{settings.ADMIN_EMAIL}' not found, creating one...")
            admin_user_in = UserCreate(
                name="Admin User",
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD,
                role="admin"
            )
            await create_user(db=db, user=admin_user_in)
            print(f"Admin user '{settings.ADMIN_EMAIL}' created successfully.")
        else:
            print(f"Admin user '{settings.ADMIN_EMAIL}' already exists.")
    except Exception as e:
        print(f"An error occurred during admin initialization: {e}")
    finally:
        await db.close()
        print("Finished admin user initialization.")

if __name__ == "__main__":
    asyncio.run(main()) 