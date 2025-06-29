import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

from app.main import app
from app.core.crud.audit_log import get_audit_logs
from app.schemas.audit_log import AuditLogCreate
from app.core.logging_context import current_user_var
from app.models.user import User
from app.models.product import Product
from app.models.inward import InwardLog
from app.models.sales import SalesLog
from app.models.orders import Order

client = TestClient(app)

@pytest.fixture
def mock_user():
    return User(
        id=1,
        email="test@example.com",
        name="Test User",
        role="admin"
    )

@pytest.fixture
def mock_product_data():
    return {
        "name": "Test Product",
        "sku": "TEST001",
        "description": "Test Description",
        "unit_price": 100.0,
        "sizes": ["S", "M", "L"],
        "colors": [{"color": "Red", "colour_code": 101}],
        "allowed_stores": ["Store A"],
        "allowed_agencies": ["Agency A"]
    }

@pytest.fixture
def mock_inward_data():
    return {
        "product_id": 1,
        "color": "Red",
        "colour_code": 101,
        "sizes": {"S": 10, "M": 5},
        "date": "2024-01-15",
        "category": "Supply",
        "stakeholder_name": "Store A",
        "operation": "Inward"
    }

@pytest.fixture
def mock_sales_data():
    return {
        "product_id": 1,
        "color": "Red",
        "colour_code": 101,
        "sizes": {"S": 2, "M": 1},
        "date": "2024-01-16",
        "agency_name": "Agency A",
        "store_name": "Store A",
        "operation": "Sale"
    }

@pytest.fixture
def mock_order_data():
    return {
        "product_id": 1,
        "date": "2024-01-17",
        "colour_code": 101,
        "color": "Red",
        "sizes": {"S": 5, "M": 3},
        "agency_name": "Agency A",
        "store_name": "Store A",
        "operation": "Order",
        "order_number": 1001,
        "financial_year": "2024-25"
    }

class TestAuditLogging:
    """Test comprehensive audit logging functionality"""

    @pytest.mark.asyncio
    async def test_product_create_audit_log(self, mock_user, mock_product_data):
        """Test that product creation is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.product.create_product') as mock_create:
                mock_product = Product(id=1, **mock_product_data)
                mock_create.return_value = mock_product
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate product creation
                    await mock_create(None, mock_product_data)
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "CREATE"
                    assert call_args.entity == "Product"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_product_update_audit_log(self, mock_user, mock_product_data):
        """Test that product updates are properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.product.update_product') as mock_update:
                updated_product = Product(id=1, **mock_product_data)
                updated_product.name = "Updated Product"
                mock_update.return_value = updated_product
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate product update
                    await mock_update(None, 1, {"name": "Updated Product"})
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "UPDATE"
                    assert call_args.entity == "Product"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_product_delete_audit_log(self, mock_user):
        """Test that product deletion is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.product.delete_product') as mock_delete:
                mock_delete.return_value = True
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate product deletion
                    await mock_delete(None, 1)
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "DELETE"
                    assert call_args.entity == "Product"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_inward_log_create_audit_log(self, mock_user, mock_inward_data):
        """Test that inward log creation is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.inward.create_inward_log') as mock_create:
                mock_inward = InwardLog(id=1, **mock_inward_data)
                mock_create.return_value = mock_inward
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate inward log creation
                    await mock_create(None, mock_inward_data)
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "CREATE"
                    assert call_args.entity == "InwardLog"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_sales_log_create_audit_log(self, mock_user, mock_sales_data):
        """Test that sales log creation is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.sales.create_sales_log') as mock_create:
                mock_sales = SalesLog(id=1, **mock_sales_data)
                mock_create.return_value = mock_sales
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate sales log creation
                    await mock_create(None, mock_sales_data)
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "CREATE"
                    assert call_args.entity == "SalesLog"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_order_create_audit_log(self, mock_user, mock_order_data):
        """Test that order creation is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.orders.create_order') as mock_create:
                mock_order = Order(id=1, **mock_order_data)
                mock_create.return_value = mock_order
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate order creation
                    await mock_create(None, mock_order_data)
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "CREATE"
                    assert call_args.entity == "Order"
                    assert call_args.entity_id == 1

    @pytest.mark.asyncio
    async def test_user_create_audit_log(self, mock_user):
        """Test that user creation is properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock the database session and CRUD operations
            with patch('app.core.crud.user.create_user') as mock_create:
                new_user = User(id=2, email="new@example.com", name="New User", role="manager")
                mock_create.return_value = new_user
                
                # Mock audit log creation
                with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                    # Simulate user creation
                    await mock_create(None, {"email": "new@example.com", "name": "New User", "password": "password123", "role": "manager"})
                    
                    # Verify audit log was created
                    mock_audit.assert_called_once()
                    call_args = mock_audit.call_args[0][1]
                    assert isinstance(call_args, AuditLogCreate)
                    assert call_args.user_id == mock_user.id
                    assert call_args.username == mock_user.email
                    assert call_args.action == "CREATE"
                    assert call_args.entity == "User"
                    assert call_args.entity_id == 2

    @pytest.mark.asyncio
    async def test_login_audit_log(self, mock_user):
        """Test that login attempts are properly logged"""
        with patch('app.core.crud.user.authenticate_user') as mock_auth:
            mock_auth.return_value = mock_user
            
            # Mock audit log creation
            with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                # Simulate successful login
                await mock_auth(None, "test@example.com", "password123")
                
                # Verify audit log was created
                mock_audit.assert_called_once()
                call_args = mock_audit.call_args[0][1]
                assert isinstance(call_args, AuditLogCreate)
                assert call_args.user_id == mock_user.id
                assert call_args.username == mock_user.email
                assert call_args.action == "LOGIN"
                assert call_args.entity == "User"
                assert call_args.entity_id == mock_user.id

    @pytest.mark.asyncio
    async def test_failed_login_audit_log(self):
        """Test that failed login attempts are properly logged"""
        with patch('app.core.crud.user.authenticate_user') as mock_auth:
            mock_auth.return_value = None
            
            # Mock audit log creation
            with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                # Simulate failed login
                await mock_auth(None, "invalid@example.com", "wrongpassword")
                
                # Verify audit log was created
                mock_audit.assert_called_once()
                call_args = mock_audit.call_args[0][1]
                assert isinstance(call_args, AuditLogCreate)
                assert call_args.user_id == 0
                assert call_args.username == "invalid@example.com"
                assert call_args.action == "LOGIN_FAILED"
                assert call_args.entity == "User"
                assert call_args.entity_id == 0

    @pytest.mark.asyncio
    async def test_bulk_operations_audit_log(self, mock_user):
        """Test that bulk operations are properly logged"""
        with patch('app.core.logging_context.current_user_var') as mock_context:
            mock_context.get.return_value = mock_user
            
            # Mock audit log creation
            with patch('app.core.crud.audit_log.create_audit_log') as mock_audit:
                # Simulate bulk inward log creation
                bulk_data = [{"product_id": 1, "color": "Red", "sizes": {"S": 10}}]
                
                # Verify bulk operation audit log
                mock_audit.assert_called()
                call_args = mock_audit.call_args[0][1]
                assert isinstance(call_args, AuditLogCreate)
                assert call_args.user_id == mock_user.id
                assert call_args.username == mock_user.email
                assert call_args.action == "BULK_CREATE"
                assert call_args.entity in ["InwardLog", "SalesLog", "Order"]

    @pytest.mark.asyncio
    async def test_audit_log_retrieval(self):
        """Test that audit logs can be retrieved with filters"""
        with patch('app.core.crud.audit_log.get_audit_logs') as mock_get:
            mock_logs = [
                {"id": 1, "user_id": 1, "action": "CREATE", "entity": "Product"},
                {"id": 2, "user_id": 1, "action": "UPDATE", "entity": "Product"}
            ]
            mock_get.return_value = mock_logs
            
            # Test filtering by user
            logs = await mock_get(None, user_id=1)
            assert len(logs) == 2
            
            # Test filtering by entity
            logs = await mock_get(None, entity="Product")
            assert len(logs) == 2
            
            # Test filtering by action
            logs = await mock_get(None, user_id=1, entity="Product")
            assert len(logs) == 2

    def test_audit_log_schema_validation(self):
        """Test that audit log schema validation works correctly"""
        # Valid audit log
        valid_log = AuditLogCreate(
            user_id=1,
            username="test@example.com",
            action="CREATE",
            entity="Product",
            entity_id=1,
            field_changed="name",
            old_value="Old Name",
            new_value="New Name"
        )
        assert valid_log.user_id == 1
        assert valid_log.username == "test@example.com"
        assert valid_log.action == "CREATE"
        assert valid_log.entity == "Product"
        assert valid_log.entity_id == 1
        assert valid_log.field_changed == "name"
        assert valid_log.old_value == "Old Name"
        assert valid_log.new_value == "New Name"

    def test_audit_log_without_user_context(self):
        """Test that audit logging works even without user context"""
        # Set user context to None
        current_user_var.set(None)
        
        # Create audit log without user context
        log = AuditLogCreate(
            user_id=None,
            username="system",
            action="SYSTEM",
            entity="System",
            entity_id=0,
            field_changed="maintenance",
            new_value="System maintenance performed"
        )
        
        assert log.user_id is None
        assert log.username == "system"
        assert log.action == "SYSTEM"
        assert log.entity == "System" 