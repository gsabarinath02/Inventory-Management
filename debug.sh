#!/bin/bash

echo "=== Inventory Management System Debug Script ==="
echo

echo "1. Checking Docker containers status..."
docker-compose ps
echo

echo "2. Checking backend logs..."
docker-compose logs --tail=20 backend
echo

echo "3. Checking frontend logs..."
docker-compose logs --tail=20 frontend
echo

echo "4. Checking postgres logs..."
docker-compose logs --tail=10 postgres
echo

echo "5. Testing backend health..."
curl -f http://localhost:8000/ || echo "Backend is not responding"
echo

echo "6. Testing frontend health..."
curl -f http://localhost:3000/ || echo "Frontend is not responding"
echo

echo "7. Testing database connection..."
docker-compose exec postgres pg_isready -U postgres || echo "Database is not ready"
echo

echo "=== Debug complete ===" 