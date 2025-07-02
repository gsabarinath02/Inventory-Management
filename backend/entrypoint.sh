#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Creating initial admin user..."
python /app/init_admin.py

exec "$@" 