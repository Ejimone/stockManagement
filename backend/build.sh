#!/usr/bin/env bash
# build.sh - Render build script

set -o errexit  # exit on error

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"
