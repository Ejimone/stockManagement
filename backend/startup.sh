#!/bin/bash

# Exit on any error
set -e

echo "Starting Django server..."
# Start the Django development server
python manage.py runserver