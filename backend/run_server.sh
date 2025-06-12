#!/bin/bash
# Script to run Django development server on all interfaces
echo "Starting Django server on all network interfaces (0.0.0.0:8000)"
echo "Note: This allows devices on your network to access the server"
echo "Press Ctrl+C to stop the server"
python manage.py runserver 0.0.0.0:8000
