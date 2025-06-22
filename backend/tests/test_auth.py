import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.database import Base, get_db
from app.core.crud.user import create_user, get_user_by_email
from app.schemas.user import UserCreate
from app.core.security import verify_password
from app.models.user import UserRole

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

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def admin_user():
    db = TestingSessionLocal()
    admin = UserCreate(
        name="Admin User",
        email="admin@test.com",
        password="admin123",
        role="admin"
    )
    user = create_user(db, admin)
    db.close()
    return user

@pytest.fixture
def manager_user():
    db = TestingSessionLocal()
    manager = UserCreate(
        name="Manager User",
        email="manager@test.com",
        password="manager123",
        role="manager"
    )
    user = create_user(db, manager)
    db.close()
    return user

@pytest.fixture
def viewer_user():
    db = TestingSessionLocal()
    viewer = UserCreate(
        name="Viewer User",
        email="viewer@test.com",
        password="viewer123",
        role="viewer"
    )
    user = create_user(db, viewer)
    db.close()
    return user

def get_auth_headers(email, password):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestAuthentication:
    def test_login_success(self, admin_user):
        response = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self):
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_signup_admin_only(self, admin_user):
        # Test signup without admin token (should fail)
        response = client.post("/api/v1/auth/signup", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "viewer"
        })
        assert response.status_code == 401

        # Test signup with admin token (should succeed)
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.post("/api/v1/auth/signup", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "password123",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "viewer"

    def test_signup_duplicate_email(self, admin_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.post("/api/v1/auth/signup", json={
            "name": "Duplicate User",
            "email": "admin@test.com",  # Same email as admin
            "password": "password123",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code == 400

class TestRoleBasedAccess:
    def test_admin_access_to_users(self, admin_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 200

    def test_manager_access_to_users(self, manager_user):
        headers = get_auth_headers("manager@test.com", "manager123")
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403  # Manager cannot access users

    def test_viewer_access_to_users(self, viewer_user):
        headers = get_auth_headers("viewer@test.com", "viewer123")
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403  # Viewer cannot access users

    def test_admin_access_to_products(self, admin_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    def test_manager_access_to_products(self, manager_user):
        headers = get_auth_headers("manager@test.com", "manager123")
        response = client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    def test_viewer_access_to_products(self, viewer_user):
        headers = get_auth_headers("viewer@test.com", "viewer123")
        response = client.get("/api/v1/products/", headers=headers)
        assert response.status_code == 200

    def test_admin_can_delete_product(self, admin_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        # First create a product
        product_data = {
            "name": "Test Product",
            "sku": "TEST001",
            "unit_price": 10.0,
            "sizes": ["S", "M", "L"],
            "colors": ["Red", "Blue"]
        }
        response = client.post("/api/v1/products/", json=product_data, headers=headers)
        assert response.status_code == 201
        product_id = response.json()["id"]

        # Then delete it
        response = client.delete(f"/api/v1/products/{product_id}", headers=headers)
        assert response.status_code == 204

    def test_manager_cannot_delete_product(self, manager_user):
        headers = get_auth_headers("manager@test.com", "manager123")
        response = client.delete("/api/v1/products/1", headers=headers)
        assert response.status_code == 403

    def test_viewer_cannot_delete_product(self, viewer_user):
        headers = get_auth_headers("viewer@test.com", "viewer123")
        response = client.delete("/api/v1/products/1", headers=headers)
        assert response.status_code == 403

class TestUserManagement:
    def test_get_users_admin_only(self, admin_user, manager_user, viewer_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 3

    def test_update_user_admin_only(self, admin_user, manager_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.put(f"/api/v1/users/{manager_user.id}", json={
            "name": "Updated Manager",
            "role": "viewer"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Manager"
        assert data["role"] == "viewer"

    def test_delete_user_admin_only(self, admin_user, manager_user):
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.delete(f"/api/v1/users/{manager_user.id}", headers=headers)
        assert response.status_code == 200

    def test_manager_cannot_manage_users(self, manager_user):
        headers = get_auth_headers("manager@test.com", "manager123")
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_user(self, db: AsyncSession):
        # Test admin creation
        user_in = UserCreate(
            name="Test Admin",
            email="testadmin@example.com",
            password="password123",
            role="admin"
        )
        user = await create_user(db, user=user_in)
        assert user.email == "testadmin@example.com"
        assert user.role == "admin"
        assert verify_password("password123", user.password_hash)

    @pytest.mark.asyncio
    async def test_create_manager(self, db: AsyncSession):
        # Test manager creation
        manager_in = UserCreate(
            name="Manager User",
            email="manager@example.com",
            password="password123",
            role="manager"
        )
        manager = await create_user(db, user=manager_in)
        assert manager.role == "manager"

    @pytest.mark.asyncio
    async def test_create_viewer(self, db: AsyncSession):
        # Test viewer creation
        viewer_in = UserCreate(
            name="Viewer User",
            email="viewer@example.com",
            password="password123",
            role="viewer"
        )
        viewer = await create_user(db, user=viewer_in)
        assert viewer.role == "viewer" 