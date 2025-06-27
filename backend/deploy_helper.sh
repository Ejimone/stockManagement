#!/bin/bash

# Jonkech Backend Deployment Helper Script
# This script helps you deploy your Django backend to Render.com

echo "🚀 Jonkech Backend Deployment Helper"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "Usage: cd backend && ./deploy_helper.sh"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""

# 1. Check requirements.txt
if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt found"
else
    echo "❌ requirements.txt not found"
    exit 1
fi

# 2. Check build.sh
if [ -f "build.sh" ]; then
    echo "✅ build.sh found"
else
    echo "❌ build.sh not found"
    exit 1
fi

# 3. Check if build.sh is executable
if [ -x "build.sh" ]; then
    echo "✅ build.sh is executable"
else
    echo "⚠️  Making build.sh executable..."
    chmod +x build.sh
fi

# 4. Test static files collection
echo "🔄 Testing static files collection..."
python manage.py collectstatic --noinput --dry-run > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Static files collection test passed"
else
    echo "❌ Static files collection test failed"
    echo "Please check your Django settings"
    exit 1
fi

# 5. Check git status
if [ -d ".git" ] || [ -d "../.git" ]; then
    echo "✅ Git repository detected"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  You have uncommitted changes"
        echo "   Consider committing them before deployment:"
        echo "   git add ."
        echo "   git commit -m 'Prepare for deployment'"
        echo "   git push origin main"
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "❌ No git repository found"
    echo "   Please initialize git and push to GitHub:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin YOUR_GITHUB_REPO_URL"
    echo "   git push -u origin main"
    exit 1
fi

echo ""
echo "🎯 Deployment URLs:"
echo "==================="
echo "Render.com: https://render.com"
echo "Railway.app: https://railway.app"
echo ""

echo "📝 Environment Variables Needed:"
echo "================================"
echo "SECRET_KEY=qykplipj*h%)u54^xjf(m&k&t(@)op*dpi5*6xlle95v8s)n^m"
echo "DEBUG=False"
echo "FIREBASE_API_KEY=AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw"
echo "FIREBASE_AUTH_DOMAIN=opecode-9e47b.firebaseapp.com"
echo "FIREBASE_PROJECT_ID=opecode-9e47b"
echo "FIREBASE_STORAGE_BUCKET=opecode-9e47b.firebasestorage.app"
echo "FIREBASE_MESSAGING_SENDER_ID=171791860064"
echo "FIREBASE_APP_ID=1:171791860064:web:4a08a49bb7df7d27ca5e05"
echo "FIREBASE_MEASUREMENT_ID=G-PP81X1N21M"
echo ""

echo "🔧 Render.com Configuration:"
echo "============================"
echo "Build Command: ./build.sh"
echo "Start Command: gunicorn backend.wsgi:application"
echo "Python Version: 3.11.0"
echo "Root Directory: backend"
echo ""

echo "✅ Your backend is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub (if not done already)"
echo "2. Go to render.com and create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Use the configuration shown above"
echo "5. Add the environment variables"
echo "6. Deploy!"
echo ""
echo "📱 After deployment, update your React Native app's API URL:"
echo "const API_BASE_URL = 'https://your-app-name.onrender.com';"
echo ""
echo "🎉 Happy deploying!"
