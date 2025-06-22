# Inventory Management System

A full-stack inventory management tool built with FastAPI (backend) and React (frontend) with support for product variants (sizes and colors), stock matrix visualization, and CSV data upload.

## Features

### Backend (FastAPI)
- **Product Management**: CRUD operations for products with size/color variants
- **Stock Tracking**: Inward and sales logs with size/color granularity
- **Stock Matrix API**: Group stock by color and size combinations
- **PostgreSQL Database**: Async SQLAlchemy with asyncpg
- **CORS Enabled**: Configured for frontend integration

### Frontend (React + Vite)
- **Product List**: AG-Grid table with inline editing
- **Stock Matrix View**: Color × Size grid showing current stock levels
- **CSV Upload**: Paste CSV data for bulk inward/sales log creation
- **Ant Design UI**: Modern, responsive interface
- **Real-time Refresh**: Update stock data with refresh button

## Quick Start

### Using Docker Compose (Recommended)

#### Production Mode
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Development Mode (with hot reload)
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Manual Setup

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python init_db.py  # Initialize database with sample data
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:3000/health

## API Endpoints

### Products
- `GET /products` - List all products
- `POST /products` - Create new product
- `GET /products/{id}` - Get product details
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Stock
- `GET /stock/{id}` - Get product stock summary
- `GET /api/v1/stock/{id}/matrix` - Get stock matrix by color/size

### Inward Logs
- `GET /inward` - List inward logs
- `POST /inward` - Create inward log

### Sales Logs
- `GET /sales` - List sales logs
- `POST /sales` - Create sales log

## Data Models

### Product
```json
{
  "id": 1,
  "name": "T-Shirt",
  "sku": "TS001",
  "description": "Cotton T-Shirt",
  "unit_price": 25.99,
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Red", "Blue", "Black"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Inward/Sales Log
```json
{
  "product_id": 1,
  "quantity": 10,
  "unit_cost": 15.00,  // inward only
  "unit_price": 25.99, // sales only
  "size": "M",
  "color": "Red",
  "supplier": "Supplier A", // inward only
  "customer": "Customer A", // sales only
  "notes": "Initial stock"
}
```

## CSV Upload Format

### Inward Log CSV
```csv
product_id,quantity,unit_cost,size,color,supplier,notes
1,10,15.00,M,Red,Supplier A,Initial stock
1,5,15.00,L,Blue,Supplier A,Restock
```

### Sales Log CSV
```csv
product_id,quantity,unit_price,size,color,customer,notes
1,2,25.99,M,Red,Customer A,Online order
1,1,25.99,L,Blue,Customer B,Store sale
```

## Stock Matrix

The stock matrix shows current inventory levels organized by:
- **Rows**: Colors
- **Columns**: Sizes
- **Cells**: Current stock (inward - sales)

Stock levels are color-coded:
- 🟢 **Green**: Positive stock
- 🟠 **Orange**: Zero stock
- 🔴 **Red**: Negative stock (oversold)

## Docker Architecture

### Production Setup
- **Frontend**: Nginx serving built React app
- **Backend**: FastAPI with uvicorn
- **Database**: PostgreSQL 15
- **Networking**: Isolated Docker network
- **Health Checks**: All services monitored

### Development Setup
- **Frontend**: Vite dev server with hot reload
- **Backend**: FastAPI with auto-reload
- **Database**: PostgreSQL 15
- **Volume Mounts**: Live code editing

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/inventory_db
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=["*"]
```

### Docker Compose
Environment variables are configured in `docker-compose.yml` for all services.

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
The application uses SQLAlchemy's `create_all()` for automatic table creation. For production, consider using Alembic for proper migrations.

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## CI/CD

GitHub Actions workflows are configured for:
- Backend linting and testing
- Frontend linting and testing
- Automatic runs on push/PR to respective directories

## Troubleshooting

### Common Issues

#### 1. **500 Internal Server Error**
**Symptoms**: API calls returning 500 errors
**Solutions**:
```bash
# Check backend logs
docker-compose logs backend

# Restart backend service
docker-compose restart backend

# Check database connection
docker-compose exec postgres pg_isready -U postgres
```

#### 2. **Database Connection Issues**
**Symptoms**: Backend can't connect to PostgreSQL
**Solutions**:
```bash
# Wait for database to be ready
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check database health
docker-compose exec postgres pg_isready -U postgres
```

#### 3. **Frontend Build Errors**
**Symptoms**: Frontend container fails to build
**Solutions**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild frontend
docker-compose build --no-cache frontend

# Check Node.js version (requires 18+)
docker-compose exec frontend node --version
```

#### 4. **API Proxy Issues**
**Symptoms**: Frontend can't reach backend API
**Solutions**:
```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/nginx.conf

# Test API directly
curl http://localhost:8000/products

# Check network connectivity
docker-compose exec frontend ping backend
```

#### 5. **Port Already in Use**
**Symptoms**: Docker can't bind to ports
**Solutions**:
```bash
# Stop all containers
docker-compose down

# Check what's using the ports
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Kill processes using the ports
sudo kill -9 <PID>
```

### Debug Script

Use the provided debug script to check all services:
```bash
chmod +x debug.sh
./debug.sh
```

### Manual Debugging Steps

1. **Check container status**:
   ```bash
   docker-compose ps
   ```

2. **View service logs**:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f postgres
   ```

3. **Test individual services**:
   ```bash
   # Test backend
   curl http://localhost:8000/
   
   # Test frontend
   curl http://localhost:3000/
   
   # Test database
   docker-compose exec postgres psql -U postgres -d inventory_db -c "SELECT 1;"
   ```

4. **Reset everything**:
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up --build -d
   ```

### Performance Issues

1. **Slow API responses**: Check database indexes and query optimization
2. **Frontend loading slowly**: Check nginx caching and gzip compression
3. **Memory issues**: Monitor container resource usage with `docker stats`

### Security Issues

1. **CORS errors**: Check CORS configuration in backend
2. **Authentication**: Implement proper authentication for production
3. **Database security**: Change default passwords and restrict access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 