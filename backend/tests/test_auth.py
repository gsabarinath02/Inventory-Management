import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.database import Base, get_db
from app.core.crud.user import create_user, get_user_by_email
from app.schemas.user import UserCreate
from app.core.security import verify_password

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = AsyncClient(app=app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session):
    user_in = UserCreate(
        name="Admin User",
        email="admin@test.com",
        password="admin123",
        role="admin"
    )
    user = await create_user(db_session, user=user_in)
    return user

@pytest_asyncio.fixture(scope="function")
async def manager_user(db_session):
    user_in = UserCreate(
        name="Manager User",
        email="manager@test.com",
        password="manager123",
        role="manager"
    )
    user = await create_user(db_session, user=user_in)
    return user

@pytest_asyncio.fixture(scope="function")
async def viewer_user(db_session):
    user_in = UserCreate(
        name="Viewer User",
        email="viewer@test.com",
        password="viewer123",
        role="viewer"
    )
    user = await create_user(db_session, user=user_in)
    return user

async def get_auth_headers(async_client, email, password):
    response = await async_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
class TestAuthentication:
    async def test_login_success(self, async_client, admin_user):
        response = await async_client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(self, async_client):
        response = await async_client.post("/api/v1/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_signup_admin_only(self, async_client, auth_token):
        # Test signup without admin token (should fail)
        response = await async_client.post("/api/v1/auth/signup", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "viewer"
        })
        assert response.status_code == 401

        # Test signup with admin token (should succeed)
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = await async_client.post("/api/v1/auth/signup", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code in (200, 201)

    async def test_signup_duplicate_email(self, async_client, admin_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.post("/api/v1/auth/signup", json={
            "name": "Duplicate User",
            "email": "admin@test.com",  # Same email as admin
            "password": "password123",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code == 400

@pytest.mark.asyncio
class TestRoleBasedAccess:
    async def test_admin_access_to_users(self, async_client, admin_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 200

    async def test_manager_access_to_users(self, async_client, manager_user):
        headers = await get_auth_headers(async_client, "manager@test.com", "manager123")
        response = await async_client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403  # Manager cannot access users

    async def test_viewer_access_to_users(self, async_client, viewer_user):
        headers = await get_auth_headers(async_client, "viewer@test.com", "viewer123")
        response = await async_client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403  # Viewer cannot access users

    async def test_admin_access_to_products(self, async_client, admin_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    async def test_manager_access_to_products(self, async_client, manager_user):
        headers = await get_auth_headers(async_client, "manager@test.com", "manager123")
        response = await async_client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    async def test_viewer_access_to_products(self, async_client, viewer_user):
        headers = await get_auth_headers(async_client, "viewer@test.com", "viewer123")
        response = await async_client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    async def test_admin_can_delete_product(self, async_client, admin_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        # First create a product
        product_data = {
            "name": "Test Product",
            "sku": "TEST001",
            "unit_price": 10.0,
            "sizes": ["S", "M", "L"],
            "colors": [
                {"color": "Red", "colour_code": 101},
                {"color": "Blue", "colour_code": 102}
            ]
        }
        response = await async_client.post("/api/v1/products/", json=product_data, headers=headers)
        assert response.status_code == 201
        product_id = response.json()["id"]

        # Then delete it
        response = await async_client.delete(f"/api/v1/products/{product_id}", headers=headers)
        assert response.status_code == 204

    async def test_manager_cannot_delete_product(self, async_client, manager_user):
        headers = await get_auth_headers(async_client, "manager@test.com", "manager123")
        response = await async_client.delete("/api/v1/products/1", headers=headers)
        assert response.status_code == 403

    async def test_viewer_cannot_delete_product(self, async_client, viewer_user):
        headers = await get_auth_headers(async_client, "viewer@test.com", "viewer123")
        response = await async_client.delete("/api/v1/products/1", headers=headers)
        assert response.status_code == 403

@pytest.mark.asyncio
class TestUserManagement:
    async def test_get_users_admin_only(self, async_client, admin_user, manager_user, viewer_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 3

    async def test_update_user_admin_only(self, async_client, admin_user, manager_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.put(f"/api/v1/users/{manager_user.id}", json={
            "name": "Updated Manager",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Manager"
        assert data["role"] == "viewer"

    async def test_delete_user_admin_only(self, async_client, admin_user, manager_user):
        headers = await get_auth_headers(async_client, "admin@test.com", "admin123")
        response = await async_client.delete(f"/api/v1/users/{manager_user.id}", headers=headers)
        assert response.status_code == 200

    async def test_manager_cannot_manage_users(self, async_client, manager_user):
        headers = await get_auth_headers(async_client, "manager@test.com", "manager123")
        response = await async_client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_user(self, db_session):
        # Test admin creation
        user_in = UserCreate(
            name="Test Admin",
            email="testadmin@example.com",
            password="password123",
            role="admin"
        )
        user = await create_user(db_session, user=user_in)
        assert user.email == "testadmin@example.com"
        assert user.role == "admin"
        assert verify_password("password123", user.password_hash)

    @pytest.mark.asyncio
    async def test_create_manager(self, db_session):
        # Test manager creation
        manager_in = UserCreate(
            name="Manager User",
            email="manager@example.com",
            password="password123",
            role="manager"
        )
        manager = await create_user(db_session, user=manager_in)
        assert manager.role == "manager"

    @pytest.mark.asyncio
    async def test_create_viewer(self, db_session):
        # Test viewer creation
        viewer_in = UserCreate(
            name="Viewer User",
            email="viewer@example.com",
            password="password123",
            role="viewer"
        )
        viewer = await create_user(db_session, user=viewer_in)
        assert viewer.role == "viewer" 