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

from app.main import app as fastapi_app  # This is the FastAPI app instance
from app.database import Base, get_db
from app.models import User as UserModel
from app.core.security import get_password_hash

# Import all model modules to register their tables
import app.models.user
import app.models.product
import app.models.inward
import app.models.sales
import app.models.product_color_stock
import app.models.audit_log
from app.models.user import User
from app.models.product import Product
from app.models.inward import InwardLog
from app.models.sales import SalesLog
from app.models.product_color_stock import ProductColorStock
from app.models.audit_log import AuditLog

TEST_DB_PATH = './test.db'
DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
engine = create_async_engine(DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, class_=AsyncSession, bind=engine
)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Do not remove the test DB file at the start to avoid PermissionError on Windows
    # Create all tables
    import asyncio
    async def create_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    asyncio.get_event_loop().run_until_complete(create_all())
    yield
    # Do not remove at the end to avoid Windows file lock issues

@pytest_asyncio.fixture(autouse=True)
async def clean_db_tables():
    # Clean all tables between tests, skip if table does not exist
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            try:
                await conn.execute(table.delete())
            except Exception as e:
                print(f"Skipping table {table.name}: {e}")

@pytest_asyncio.fixture(scope="session", autouse=True)
async def override_get_db():
    async def _override():
        async with TestingSessionLocal() as session:
            yield session
    fastapi_app.dependency_overrides[get_db] = _override
    yield
    fastapi_app.dependency_overrides[get_db] = get_db

@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def async_client(override_get_db):
    async with AsyncClient(app=fastapi_app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def auth_token():
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
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        login_data = {"email": "testadmin@example.com", "password": "testpassword"}
        resp = await ac.post("/api/v1/auth/login", json=login_data)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token = resp.json()["access_token"]
        return token 