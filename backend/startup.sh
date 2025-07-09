#!/bin/bash

# Azure App Service startup script for Django application

# Exit on any error
set -e

echo "Starting Django application deployment..."

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create logs directory
mkdir -p logs

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

echo "Starting Gunicorn server..."
# Start Gunicorn with the proper configuration
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 --access-logfile - --error-logfile - backend.wsgi:application
