#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Apply database migrations
echo "Applying database migrations..."
alembic upgrade head

# Create initial admin user
echo "Creating initial admin user..."
python /app/init_admin.py

# Now, execute the command passed to this script (e.g., uvicorn)
exec "$@" 