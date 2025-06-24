import sys
import os
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import Base, get_db
from app.models import User as UserModel
from app.core.security import get_password_hash

DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Set up the database once per session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(autouse=True)
async def clean_db_tables():
    """Clear all tables after each test to ensure isolation."""
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """A fixture to get a database session for direct data manipulation."""
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def auth_token():
    """Directly insert a test user and get a JWT token."""
    # Insert user directly
    async with TestingSessionLocal() as session:
        password_hash = get_password_hash("testpassword")
        user = UserModel(
            name="Test Admin",
            email="testadmin@example.com",
            password_hash=password_hash,
            role="admin"
        )
        session.add(user)
        await session.commit()
    # Now login via API
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        login_data = {"email": "testadmin@example.com", "password": "testpassword"}
        resp = await ac.post("/api/v1/auth/login", json=login_data)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token = resp.json()["access_token"]
        return token

@pytest_asyncio.fixture(scope="function")
async def async_client(auth_token):
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {auth_token}"}
    async with AsyncClient(transport=transport, base_url="http://testserver", headers=headers) as ac:
        yield ac 