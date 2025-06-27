#!/usr/bin/env python3
"""
Script to create a default admin user for testing the authentication system.
Run this script to create an admin user with email: admin@example.com and password: admin123
"""

import asyncio
import os
import sys
import argparse

# Add project root to the path to allow imports from 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.core.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate
from app.database import AsyncSessionLocal, Base, engine
from app.config import settings
from app.core.security import get_password_hash
from app.models import User

async def insert_admin(email: str, password: str, force_reset: bool = False):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        # Optionally delete existing user
        if force_reset:
            await session.execute(User.__table__.delete().where(User.email == email))
            await session.commit()
        # Check if user already exists
        result = await session.execute(
            User.__table__.select().where(User.email == email)
        )
        existing = result.first()
        if existing:
            print("Admin user already exists.")
            return
        user = User(
            email=email,
            name='Admin User',
            password_hash=get_password_hash(password),
            role='admin'
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Inserted admin user with id: {user.id}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or reset admin user.")
    parser.add_argument('--email', type=str, default='admin@example.com', help='Admin email')
    parser.add_argument('--password', type=str, default='admin123', help='Admin password')
    parser.add_argument('--force-reset', action='store_true', help='Delete existing user with this email before creating')
    args = parser.parse_args()
    asyncio.run(insert_admin(args.email, args.password, args.force_reset)) 