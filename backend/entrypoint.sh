#!/bin/bash
set -e

echo "Running Django migrations..."
python manage.py migrate --noinput || echo "Migrations failed, but continuing..."

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static collection failed, but continuing..."

echo "Starting Gunicorn..."
exec gunicorn config.wsgi --bind "0.0.0.0:${PORT:-8000}"
