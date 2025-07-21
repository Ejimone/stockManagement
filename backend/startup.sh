#!/bin/bash

# Exit on any error
set -e

echo "Starting Gunicorn server..."
# Start Gunicorn with the proper configuration
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 --access-logfile - --error-logfile - backend.wsgi:application
