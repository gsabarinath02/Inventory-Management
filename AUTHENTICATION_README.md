# Authentication & User Management System

This document describes the complete authentication and user management system implemented for the Inventory Management System.

## Overview

The system provides:
- **JWT-based authentication** with secure token storage
- **Role-based access control** with three roles: admin, manager, viewer
- **Protected routes** that enforce role permissions
- **User management interface** for administrators
- **Automatic session handling** with token expiry and logout

## Backend Implementation

### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum('admin', 'manager', 'viewer'), default='viewer')
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration (admin only)
- `GET /api/v1/auth/me` - Get current user info

### User Management Endpoints
- `GET /api/v1/users/` - List all users (admin only)
- `PUT /api/v1/users/{id}` - Update user (admin only)
- `DELETE /api/v1/users/{id}` - Delete user (admin only)

### Role-Based Access Control
- **Admin**: Full access to all features including user management
- **Manager**: Can access products, stock, and upload data
- **Viewer**: Can only view products and stock data

## Frontend Implementation

### Authentication Context
The `AuthContext` provides:
- User state management
- Login/logout functionality
- Token storage and validation
- Automatic session restoration

### Protected Routes
- `ProtectedRoute` component enforces authentication and role requirements
- Automatic redirection to login for unauthenticated users
- Role-based access control with appropriate error messages

### Key Components

#### Login Page (`/login`)
- Beautiful gradient background design
- Form validation for email and password
- Demo credentials display
- Error handling and loading states

#### User Management (`/users`)
- Complete CRUD operations for users
- Role assignment and management
- Table with sorting and pagination
- Modal forms for create/edit operations

#### Main Layout
- Dynamic navigation based on user role
- User dropdown with profile and logout options
- Role-based menu items (User Management for admins only)

## Security Features

### Password Security
- Passwords hashed using `passlib` with bcrypt
- Minimum 8-character password requirement
- Secure password validation

### JWT Security
- Tokens expire after 30 minutes
- Automatic token refresh handling
- Secure token storage in localStorage
- Automatic logout on token expiry

### API Security
- All endpoints protected with JWT authentication
- Role-based middleware for endpoint protection
- CORS configuration for frontend integration

## Default Users

### Admin User
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin
- **Permissions**: Full system access

## Usage Instructions

### Starting the System
1. **Backend**: Ensure Docker containers are running
   ```bash
   docker-compose up -d
   ```

2. **Frontend**: Start the development server
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access**: Navigate to `http://localhost:3001`

### Login Process
1. Navigate to the application
2. You'll be redirected to `/login` if not authenticated
3. Use the demo credentials: `admin@example.com` / `admin123`
4. After successful login, you'll be redirected to the main dashboard

### User Management (Admin Only)
1. Login as admin user
2. Navigate to "User Management" in the sidebar
3. Use the interface to:
   - View all users
   - Create new users
   - Edit existing users
   - Delete users (except yourself)

### Role Permissions

#### Admin
- ✅ View all products and stock
- ✅ Create, edit, delete products
- ✅ Upload inward and sales data
- ✅ Manage all users
- ✅ Access all system features

#### Manager
- ✅ View all products and stock
- ✅ Create, edit, delete products
- ✅ Upload inward and sales data
- ❌ Manage users
- ❌ Access admin-only features

#### Viewer
- ✅ View all products and stock
- ❌ Create, edit, delete products
- ❌ Upload data
- ❌ Manage users
- ❌ Access restricted features

## Testing

### Backend Tests
Run the authentication tests:
```bash
cd backend
python -m pytest tests/test_auth.py -v
```

### Frontend Tests
Run the frontend tests:
```bash
cd frontend
npm test
```

## API Testing

### Login Test
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Protected Endpoint Test
```bash
curl -X GET "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration

### Environment Variables
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiry time (default: 30)

### Database
- PostgreSQL database with user table
- Alembic migrations for schema management
- Automatic admin user creation on first run

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check if backend is running on port 8000
   - Verify database connection
   - Check admin user exists in database

2. **Token Expiry**
   - Tokens expire after 30 minutes
   - Automatic redirect to login page
   - Clear localStorage if issues persist

3. **Permission Denied**
   - Verify user role has required permissions
   - Check if user is properly authenticated
   - Ensure JWT token is valid

4. **CORS Issues**
   - Backend configured for `http://localhost:3001`
   - Check frontend URL matches configuration

## Security Best Practices

1. **Never store sensitive data in localStorage** (except JWT tokens)
2. **Always validate user input** on both frontend and backend
3. **Use HTTPS in production** for secure communication
4. **Implement rate limiting** for authentication endpoints
5. **Regular security audits** of the authentication system
6. **Monitor failed login attempts** for security threats

## Future Enhancements

1. **Two-factor authentication** (2FA)
2. **Password reset functionality**
3. **Session management** with multiple device support
4. **Audit logging** for user actions
5. **Advanced role permissions** with granular access control
6. **OAuth integration** for third-party authentication 