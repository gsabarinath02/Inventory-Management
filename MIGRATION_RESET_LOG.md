# Database Migration Reset Log

## Overview
This document records the complete database migration reset process performed on 2025-06-22 to resolve Alembic migration conflicts and ensure a clean, working database schema.

## Problem Statement
- Multiple migration heads existed in Alembic history
- Database tables already existed but Alembic was trying to recreate them
- Migration history and actual database state were out of sync
- `color_code` field was removed from models but still referenced in old migrations

## Solution: Complete Database Reset

### Step 1: Drop and Recreate Database
```bash
# Drop the existing database
docker exec -i abhishek-postgres-1 psql -U postgres -c "DROP DATABASE inventory_db WITH (FORCE);"

# Recreate the database
docker exec -i abhishek-postgres-1 psql -U postgres -c "CREATE DATABASE inventory_db;"
```

### Step 2: Reset Alembic Migration History
```bash
# Delete all existing migration files
Remove-Item .\alembic\versions\*.py -Force

# Stamp the database as base (no migrations applied)
alembic stamp base --purge
```

### Step 3: Generate New Clean Migration
```bash
# Generate new initial migration from current models
alembic revision --autogenerate -m "initial_clean"

# Apply the new migration
alembic upgrade head
```

### Step 4: Update Dependencies
Added `aiosqlite==0.19.0` to `backend/requirements.txt` for test environment.

### Step 5: Rebuild and Restart Services
```bash
# Rebuild backend with new dependencies
docker-compose build backend

# Restart services
docker-compose up -d backend
docker-compose up -d frontend
```

## Current Database Schema

### Products Table
- `id` (Primary Key)
- `name` (String, indexed)
- `sku` (String, unique, indexed)
- `description` (Text)
- `unit_price` (Float)
- `sizes` (JSON array)
- `colors` (JSON array)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Inward Logs Table
- `id` (Primary Key)
- `product_id` (Foreign Key to products, CASCADE DELETE)
- `quantity` (Integer)
- `unit_cost` (Float)
- `size` (String)
- `color` (String)
- `color_name` (String)
- `category` (String)
- `supplier` (String)
- `notes` (Text)
- `created_at` (DateTime)

### Sales Logs Table
- `id` (Primary Key)
- `product_id` (Foreign Key to products, CASCADE DELETE)
- `quantity` (Integer)
- `unit_price` (Float)
- `size` (String)
- `color` (String)
- `color_name` (String)
- `category` (String)
- `customer` (String)
- `notes` (Text)
- `created_at` (DateTime)

## Key Changes Made

### Removed Fields
- `color_code` field completely removed from both `InwardLog` and `SalesLog` models
- Updated all related schemas, routes, and frontend components
- CSV parsing now skips the color_code column

### Added Fields
- `color_name` (String) - Color name from CSV
- `category` (String) - Category from CSV
- Proper cascade delete relationships

### Frontend Updates
- Removed color_code columns from tables
- Added detailed stock view with tabs for:
  - Stock Matrix
  - Inward Logs (with Agency/Supplier, Category, Color Name)
  - Sales Logs (with Party Name, Category, Color Name)

## Verification

### Tests Passed
- All 20 backend tests passed (including new cascade delete test)
- Cascade delete functionality verified - when a product is deleted, all related inward_logs and sales_logs are automatically deleted
- API endpoints working correctly
- Database relationships properly established
- CSV upload functionality working with new schema (color_code removed)

### Services Status
- Backend: ✅ Running on http://localhost:8000
- Frontend: ✅ Running on http://localhost:3000
- Database: ✅ PostgreSQL running and accessible

### Key Functionality Verified
- Product creation, listing, updating, and deletion
- Inward log creation and management
- Sales log creation and management
- Stock matrix calculation
- CSV upload for both inward and sales data
- Cascade delete when products are removed
- All fields from Excel file properly implemented in UI

## Migration File
Generated: `faeb100419c6_initial_clean.py`

## Commands for Future Reference

### Check Migration Status
```bash
alembic current
alembic history
alembic heads
```

### Generate New Migration
```bash
alembic revision --autogenerate -m "description_of_changes"
alembic upgrade head
```

### Reset Database (if needed)
```bash
docker exec -i abhishek-postgres-1 psql -U postgres -c "DROP DATABASE inventory_db WITH (FORCE);"
docker exec -i abhishek-postgres-1 psql -U postgres -c "CREATE DATABASE inventory_db;"
alembic stamp base --purge
alembic revision --autogenerate -m "initial_clean"
alembic upgrade head
```

## Notes
- All `color_code` references have been completely removed
- Database now has a single, clean migration history
- Cascade deletes work properly for product deletion
- All fields from Excel file are now properly implemented in the UI 