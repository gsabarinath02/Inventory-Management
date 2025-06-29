 # Backstitch Inventory Management System

A comprehensive, full-stack inventory management solution designed for textile and apparel businesses. This system provides robust product management, stock tracking, sales monitoring, order processing, and comprehensive audit logging with role-based access control.

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy (Async)
- **Frontend**: React 18 + TypeScript + Ant Design + Vite
- **Database**: PostgreSQL 15 with Alembic migrations
- **Authentication**: JWT with role-based access control
- **Deployment**: Docker Compose with multi-stage builds
- **Testing**: Jest + React Testing Library (Frontend) + Pytest (Backend)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Product Mgmt  │    │ • REST APIs     │    │ • Products      │
│ • Stock Matrix  │    │ • Auth System   │    │ • Stock Logs    │
│ • Upload Tools  │    │ • Audit Logging │    │ • Sales Logs    │
│ • User Mgmt     │    │ • File Export   │    │ • Orders        │
│ • Analytics     │    │ • Scheduler     │    │ • Users         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Key Features

### 1. Product Management
- **Multi-variant Products**: Support for size/color combinations with color-code mapping
- **SKU Management**: Unique product identifiers with validation
- **Price Tracking**: Unit price management with GST calculations
- **Store/Agency Restrictions**: Configure allowed stores and agencies per product
- **Bulk Operations**: Create, update, and delete multiple products efficiently

### 2. Stock Management
- **Real-time Stock Matrix**: Visual grid showing stock levels by color and size
- **Inward Logs**: Track incoming inventory with supplier details
- **Sales Logs**: Monitor outgoing inventory with store/agency information
- **Atomic Updates**: Database transactions ensure data consistency
- **Stock Alerts**: Low stock notifications and warnings

### 3. Order Processing
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Excel Export**: Generate professional order sheets with company branding
- **Bulk Order Operations**: Create and manage multiple orders simultaneously
- **Order Tracking**: Monitor order status and fulfillment progress

### 4. Customer & Agency Management
- **Customer Database**: Store customer information with GST details
- **Agency Management**: Track agencies with regional coverage
- **Payment Terms**: Configure payment days and terms
- **Contact Management**: Multiple contact numbers and addresses

### 5. Advanced Upload System
- **Excel Integration**: Paste tab-delimited data directly from Excel
- **Bulk Data Import**: Import large datasets with validation
- **Data Validation**: Real-time validation of color/size combinations
- **Overwrite Protection**: Safe replacement of existing data with confirmation
- **Error Handling**: Comprehensive error reporting and recovery

### 6. User Management & Security
- **Role-Based Access Control**: Admin, Manager, and Viewer roles
- **JWT Authentication**: Secure token-based authentication
- **Audit Logging**: Complete audit trail of all system changes
- **User Management**: Create, edit, and manage user accounts
- **Session Management**: Automatic token refresh and logout

### 7. Analytics & Reporting
- **Dashboard Statistics**: Real-time product and value metrics
- **Stock Analytics**: Comprehensive stock level reporting
- **Sales Analytics**: Sales performance and trend analysis
- **Export Capabilities**: Excel and CSV export functionality

### 8. Geographic Features
- **Region Mapping**: Interactive maps showing agency coverage areas
- **Location Tracking**: Store and agency location management
- **Territory Management**: Regional assignment and monitoring

## 📋 Prerequisites

- **Docker & Docker Compose** (for containerized deployment)
- **Node.js 18+** (for local frontend development)
- **Python 3.9+** (for local backend development)
- **PostgreSQL 15** (for local database development)

## 🛠️ Installation & Setup

### Option 1: Docker Compose (Recommended)

#### Production Deployment
```bash
# Clone the repository
git clone <repository-url>
cd Abhishek

# Start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Development Environment
```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build -d

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Database: localhost:5432
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/inventory_db"
export SECRET_KEY="your-secret-key-here"

# Run database migrations
alembic upgrade head

# Initialize admin user
python init_admin.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

#### Database Setup
```bash
# Create PostgreSQL database
createdb inventory_db

# Run migrations
cd backend
alembic upgrade head
```

## 🔐 Authentication & Access

### Default Admin User
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Admin (full system access)

### User Roles

#### Admin
- ✅ Full system access
- ✅ User management
- ✅ Product management
- ✅ Stock operations
- ✅ Audit logs access
- ✅ System configuration

#### Manager
- ✅ Product management
- ✅ Stock operations
- ✅ Sales and inward logs
- ✅ Order management
- ❌ User management
- ❌ Audit logs access

#### Viewer
- ✅ View products and stock
- ✅ Read-only access to logs
- ❌ No modification permissions
- ❌ No administrative access

## 📊 Data Models

### Product Structure
```json
{
  "id": 1,
  "name": "Premium Cotton T-Shirt",
  "sku": "TS001",
  "description": "High-quality cotton t-shirt",
  "unit_price": 599.99,
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colors": [
    {"color": "Red", "colour_code": 101},
    {"color": "Blue", "colour_code": 102}
  ],
  "allowed_stores": ["Store A", "Store B"],
  "allowed_agencies": ["Agency X", "Agency Y"]
}
```

### Stock Matrix
```
┌─────────┬─────┬─────┬─────┬─────┬─────┬─────────┐
│ Color   │  S  │  M  │  L  │ XL  │ XXL │  Total  │
├─────────┼─────┼─────┼─────┼─────┼─────┼─────────┤
│ Red     │ 10  │ 15  │ 20  │ 12  │  8  │   65    │
│ Blue    │  8  │ 12  │ 18  │ 10  │  6  │   54    │
└─────────┴─────┴─────┴─────┴─────┴─────┴─────────┘
```

### Inward Log Format
```
Date        Color   Colour Code  S   M   L   Category  Stakeholder
2024-01-15  Red     101          10  15  20  Supply    Store A
2024-01-15  Blue    102          8   12  18  Supply    Store B
```

### Sales Log Format
```
Date        Color   Colour Code  S   M   L   Agency    Store
2024-01-16  Red     101          2   3   5   Agency X  Store Y
2024-01-16  Blue    102          1   2   3   Agency Y  Store Z
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration (admin only)
- `GET /api/v1/auth/me` - Get current user info

### Products
- `GET /api/v1/products` - List all products
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/{id}` - Get product details
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Stock Management
- `GET /api/v1/stock/{product_id}` - Get stock matrix
- `GET /api/v1/stock/{product_id}/details` - Get detailed stock info

### Inward Logs
- `GET /api/v1/inward/{product_id}` - Get inward logs
- `POST /api/v1/inward/` - Create inward log
- `POST /api/v1/inward/bulk-create` - Bulk create inward logs
- `DELETE /api/v1/inward/bulk-delete` - Bulk delete inward logs

### Sales Logs
- `GET /api/v1/sales/{product_id}` - Get sales logs
- `POST /api/v1/sales/` - Create sales log
- `POST /api/v1/sales/bulk-create` - Bulk create sales logs
- `DELETE /api/v1/sales/bulk-delete` - Bulk delete sales logs

### Orders
- `GET /api/v1/orders/` - List all orders
- `POST /api/v1/products/{product_id}/orders` - Create order
- `POST /api/v1/orders/export-excel` - Export orders to Excel
- `PUT /api/v1/orders/{order_id}` - Update order
- `DELETE /api/v1/orders/{order_id}` - Delete order

### User Management
- `GET /api/v1/users/` - List users (admin only)
- `POST /api/v1/users/` - Create user (admin only)
- `PUT /api/v1/users/{id}` - Update user (admin only)
- `DELETE /api/v1/users/{id}` - Delete user (admin only)

### Audit Logs
- `GET /api/v1/audit-logs/` - Get audit logs (admin only)

### Customers & Agencies
- `GET /api/v1/customers/` - List customers
- `POST /api/v1/customers/` - Create customer
- `GET /api/v1/agencies/` - List agencies
- `POST /api/v1/agencies/` - Create agency

## 🎯 Key Workflows

### 1. Product Creation Workflow
1. Navigate to Products page
2. Click "Add Product" button
3. Fill in product details (name, SKU, price)
4. Add sizes (S, M, L, XL, etc.)
5. Add colors with color codes
6. Configure allowed stores and agencies
7. Save product

### 2. Stock Management Workflow
1. Select product from Product View
2. View current stock matrix
3. Add inward logs for new inventory
4. Record sales logs for outgoing inventory
5. Monitor stock levels and alerts

### 3. Bulk Data Import Workflow
1. Navigate to Upload page
2. Select product and log type (Inward/Sales/Orders)
3. Use "Bulk Paste from Excel" feature
4. Paste tab-delimited data from Excel
5. Validate data format and color/size combinations
6. Preview data before import
7. Confirm overwrite if replacing existing data

### 4. Order Processing Workflow
1. Create new order for specific product
2. Specify color, size quantities, and destination
3. Generate order number and track status
4. Export order to Excel with company branding
5. Monitor order fulfillment progress

### 5. User Management Workflow
1. Admin logs into system
2. Navigate to User Management
3. Create new users with appropriate roles
4. Assign permissions and access levels
5. Monitor user activity through audit logs

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_products.py

# Run with coverage
pytest --cov=app tests/

# Run with verbose output
pytest -v
```

### Frontend Testing
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run full test suite
npm run test:full
```

### Test Coverage
- **Backend**: Unit tests for all API endpoints, models, and services
- **Frontend**: Component tests, hook tests, and integration tests
- **Coverage**: Minimum 80% code coverage requirement
- **E2E**: Playwright tests for critical user workflows

## 📈 Performance & Scalability

### Backend Optimizations
- **Async Database Operations**: Non-blocking database queries
- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis integration for frequently accessed data
- **Pagination**: Large dataset handling with pagination
- **Indexing**: Optimized database indexes for fast queries

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo and useMemo for performance
- **Virtual Scrolling**: AG-Grid for large data tables
- **Bundle Optimization**: Tree shaking and minification
- **CDN Integration**: Static asset optimization

### Database Optimizations
- **Proper Indexing**: Strategic database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Managed database connections
- **Backup Strategy**: Automated database backups
- **Monitoring**: Database performance monitoring

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure session handling
- **Token Expiration**: Automatic token refresh

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting and throttling

### Audit & Compliance
- **Audit Logging**: Complete system activity tracking
- **Data Encryption**: Sensitive data encryption
- **Access Logs**: User access and action logging
- **Compliance**: GDPR and data protection compliance
- **Backup Security**: Encrypted backup storage

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy with Docker
docker-compose -f docker-compose.prod.yml up --build -d

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:port/db
export SECRET_KEY=your-production-secret-key

# Run database migrations
docker-compose exec backend alembic upgrade head

# Initialize admin user
docker-compose exec backend python init_admin.py
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# External Services
REDIS_URL=redis://localhost:6379
```

### Monitoring & Logging
- **Application Logs**: Structured logging with log levels
- **Error Tracking**: Comprehensive error monitoring
- **Performance Monitoring**: Application performance metrics
- **Health Checks**: System health monitoring endpoints
- **Alerting**: Automated alert system for critical issues

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **Python**: Follow PEP 8 style guide
- **TypeScript**: Use strict TypeScript configuration
- **React**: Follow React best practices
- **Testing**: Maintain 80%+ test coverage
- **Documentation**: Update documentation for changes

### Commit Guidelines
- Use conventional commit messages
- Include descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

## 📚 Documentation

### Additional Documentation
- [Authentication Guide](AUTHENTICATION_README.md) - Complete authentication system documentation
- [API Documentation](http://localhost:8000/docs) - Interactive API documentation
- [Test Reports](frontend/TEST_SUMMARY.md) - Comprehensive test coverage reports
- [Migration Logs](MIGRATION_RESET_LOG.md) - Database migration history

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Frontend Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --force
```

#### Backend Startup Issues
```bash
# Check backend logs
docker-compose logs backend

# Run migrations manually
docker-compose exec backend alembic upgrade head

# Initialize database
docker-compose exec backend python init_db.py
```

### Performance Issues
- Check database query performance
- Monitor memory usage
- Review application logs
- Optimize database indexes
- Implement caching strategies

### Security Issues
- Review audit logs for suspicious activity
- Check user permissions and roles
- Validate input data and sanitization
- Monitor API rate limiting
- Review security headers and CORS settings

## 📞 Support

### Getting Help
- **Documentation**: Check the comprehensive documentation
- **Issues**: Report bugs and feature requests via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact support team for urgent issues

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 20GB storage
- **Recommended**: 8GB RAM, 4 CPU cores, 50GB storage
- **Production**: 16GB RAM, 8 CPU cores, 100GB storage

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **FastAPI** for the excellent web framework
- **React** and **Ant Design** for the frontend components
- **PostgreSQL** for the robust database system
- **Docker** for containerization and deployment
- **AG-Grid** for the powerful data grid component

---

**Backstitch Inventory Management System** - Empowering textile businesses with comprehensive inventory control and management solutions.