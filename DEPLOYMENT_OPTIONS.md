# 🚀 Django Backend Deployment Guide

## Option 1: Render.com (Recommended - FREE & Easy)

### Why Render.com?
- **Free tier available** with 750 hours/month
- **Zero configuration** - works out of the box
- **Automatic HTTPS** and SSL certificates
- **Git-based deployment** - just push to GitHub
- **Built-in CI/CD** pipeline
- **Easy environment variables** management

### Step-by-Step Deployment on Render

#### 1. Push Your Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

#### 2. Create Web Service on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `stock-management-api`
- **Environment**: `Python 3`
- **Region**: `Oregon (US West)` or closest to you
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start Command**: `gunicorn backend.wsgi:application`

#### 3. Environment Variables
Add these in Render dashboard under "Environment":

```
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=backend.settings
FIREBASE_API_KEY=AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw
FIREBASE_AUTH_DOMAIN=opecode-9e47b.firebaseapp.com
FIREBASE_PROJECT_ID=opecode-9e47b
FIREBASE_STORAGE_BUCKET=opecode-9e47b.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=171791860064
FIREBASE_APP_ID=1:171791860064:web:4a08a49bb7df7d27ca5e05
FIREBASE_MEASUREMENT_ID=G-PP81X1N21M
```

#### 4. Deploy
Click "Create Web Service" and wait for deployment (5-10 minutes)

---

## Option 2: Railway.app (Great Free Tier)

### Why Railway?
- **$5 free credits** monthly
- **Very simple** deployment process
- **Automatic scaling**
- **Built-in database** options

### Railway Deployment Steps

#### 1. Connect GitHub Repository
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

#### 2. Configure Python Service
1. Railway auto-detects Python
2. Set **Root Directory**: `backend`
3. Add environment variables (same as Render)

#### 3. Deploy
Railway automatically deploys on every push to main branch

---

## Option 3: Heroku (Paid but Reliable)

### Why Heroku?
- **Industry standard** for Django deployment
- **Extensive add-ons** ecosystem
- **Professional features**
- **Great documentation**

### Heroku Deployment Steps

#### 1. Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Verify installation
heroku --version
```

#### 2. Login and Create App
```bash
heroku login
heroku create your-app-name
```

#### 3. Configure Django for Heroku
Add this to your `backend/requirements.txt`:
```
gunicorn
django-heroku
```

#### 4. Create Procfile
Create `backend/Procfile`:
```
web: gunicorn backend.wsgi:application
release: python manage.py migrate
```

#### 5. Deploy
```bash
git add .
git commit -m "Configure for Heroku"
git push heroku main
```

---

## Option 4: PythonAnywhere (Beginner-Friendly)

### Why PythonAnywhere?
- **Always free** tier available
- **Built for Python** applications
- **Easy Django** setup
- **Web-based** file editor

### PythonAnywhere Steps
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload your code via Files tab
3. Create a new Web app
4. Configure WSGI file
5. Set environment variables

---

## Quick Deploy Script for Render

I've created a script to help you deploy quickly:

```bash
#!/bin/bash
# Quick setup for Render deployment

echo "🚀 Preparing Django app for Render deployment..."

# Generate a new secret key
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
```

## After Deployment

Once deployed, you'll get a URL like:
- **Render**: `https://your-app-name.onrender.com`
- **Railway**: `https://your-app-name.up.railway.app`
- **Heroku**: `https://your-app-name.herokuapp.com`

### Update Your Frontend

Update your frontend API configuration:

```typescript
// In frontend/services/api.ts
const getInitialApiBaseUrl = (): string => {
  const productionUrl = "https://your-deployed-app.onrender.com/api/";
  
  console.log("🌐 Using production API:", productionUrl);
  return productionUrl;
};
```

## Recommended Approach

**For immediate deployment**: Use **Render.com** (Option 1) - it's free, reliable, and requires minimal configuration.

**For future scaling**: Consider **Railway** or **Heroku** for more advanced features.

**For Azure deployment**: We can retry Azure deployment once the MFA issue is resolved.

## Next Steps

1. **Choose a platform** (Render recommended)
2. **Push code to GitHub**
3. **Deploy using the guide above**
4. **Update frontend API URL**
5. **Test the deployment**

Let me know which option you'd like to pursue, and I'll help you with the specific steps!
