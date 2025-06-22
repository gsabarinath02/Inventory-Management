#!/bin/bash

echo "🔄 Starting complete database reset..."

# Stop all containers and remove volumes
echo "📦 Stopping containers and removing volumes..."
docker-compose -f docker-compose.dev.yml down -v

# Remove any existing migration files (except __init__.py)
echo "🗑️  Removing existing migration files..."
find backend/alembic/versions -name "*.py" ! -name "__init__.py" -delete

# Start only the database container
echo "🐘 Starting PostgreSQL container..."
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize Alembic (if needed)
echo "🔧 Initializing Alembic..."
docker-compose -f docker-compose.dev.yml run --rm backend alembic init alembic 2>/dev/null || echo "Alembic already initialized"

# Generate initial migration
echo "📝 Generating initial migration..."
docker-compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "Initial migration"

# Apply migrations
echo "🚀 Applying migrations..."
docker-compose -f docker-compose.dev.yml run --rm backend alembic upgrade head

# Verify migration status
echo "✅ Verifying migration status..."
docker-compose -f docker-compose.dev.yml run --rm backend alembic current

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.dev.yml up -d

echo "🎉 Database reset complete!"
echo "📊 Services status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🔍 To check if everything is working:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  Health:   http://localhost:8000/health" 