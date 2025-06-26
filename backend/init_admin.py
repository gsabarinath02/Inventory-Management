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
from app.database import AsyncSessionLocal, Base, engine
from app.config import settings
from app.core.security import get_password_hash
from app.models import User

async def insert_admin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(
            User.__table__.select().where(User.email == 'admin@fashionstore.com')
        )
        existing = result.first()
        if existing:
            print("Admin user already exists.")
            return
        user = User(
            email='admin@fashionstore.com',
            name='Admin User',
            password_hash=get_password_hash('password'),
            role='admin'
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Inserted admin user with id: {user.id}")

if __name__ == "__main__":
    asyncio.run(insert_admin()) 