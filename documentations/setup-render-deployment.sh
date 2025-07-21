#!/bin/bash

# Quick setup for Render deployment

echo "🚀 Preparing Django app for Render deployment..."

# Generate a new secret key
cd backend
SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

echo "✅ Generated new SECRET_KEY: $SECRET_KEY"
echo ""
echo "📝 Environment variables to add in Render:"
echo "SECRET_KEY=$SECRET_KEY"
echo "DEBUG=False"
echo "DJANGO_SETTINGS_MODULE=backend.settings"
echo "FIREBASE_API_KEY=AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw"
echo "FIREBASE_AUTH_DOMAIN=opecode-9e47b.firebaseapp.com"
echo "FIREBASE_PROJECT_ID=opecode-9e47b"
echo "FIREBASE_STORAGE_BUCKET=opecode-9e47b.firebasestorage.app"
echo "FIREBASE_MESSAGING_SENDER_ID=171791860064"
echo "FIREBASE_APP_ID=1:171791860064:web:4a08a49bb7df7d27ca5e05"
echo "FIREBASE_MEASUREMENT_ID=G-PP81X1N21M"

echo ""
echo "🔧 Build Command for Render:"
echo "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate"
echo ""
echo "🚀 Start Command for Render:"
echo "gunicorn backend.wsgi:application"
echo ""
echo "📋 Render Configuration:"
echo "- Name: stock-management-api"
echo "- Environment: Python 3"
echo "- Root Directory: backend"
echo "- Branch: main"
echo ""
echo "🌐 After deployment, update your frontend API URL in:"
echo "frontend/services/api.ts"

cd ..
echo ""
echo "✅ Ready for deployment! Follow the guide in DEPLOYMENT_OPTIONS.md"
