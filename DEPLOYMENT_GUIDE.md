# Jonkech Backend Deployment Guide

## 🚀 Deploy to Render.com (Recommended)

### Prerequisites
1. GitHub account
2. Render.com account (free)
3. Your code pushed to GitHub

### Step-by-Step Deployment

#### 1. Push Your Code to GitHub
```bash
# If you haven't already, initialize git and push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Create Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `jonkech-backend`
- **Environment**: `Python 3`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn backend.wsgi:application`

#### 3. Environment Variables
Add these environment variables in Render dashboard:

```
SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=False
FIREBASE_API_KEY=AIzaSyDGCxd_wMYrQX3C3RLk59VvzgwIE0SOt1c
FIREBASE_AUTH_DOMAIN=classroom-d71b7.firebaseapp.com
FIREBASE_PROJECT_ID=classroom-d71b7
FIREBASE_STORAGE_BUCKET=classroom-d71b7.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1025622227795
FIREBASE_APP_ID=1:1025622227795:web:c96d4796e4db2fbd93bfa6
FIREBASE_MEASUREMENT_ID=G-3NQZWPJSCN
```

#### 4. Add PostgreSQL Database (Optional but Recommended)
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it `jonkech-db`
3. Copy the database URL
4. Add it as environment variable: `DATABASE_URL=your-postgres-url`

#### 5. Deploy!
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Your API will be live at: `https://your-app-name.onrender.com`

### 🔧 Update Your React Native App

Once deployed, update your React Native app's API base URL:

```javascript
// In your React Native app, update the API_BASE_URL
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

### 🏃‍♂️ Alternative: Quick Deploy to Railway

If Render doesn't work, try Railway:

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `backend`
6. Add the same environment variables
7. Deploy!

### 📱 Testing Your Deployment

Test your deployed API:
```bash
curl https://your-app-name.onrender.com/api/health/
```

### 🔄 Continuous Deployment

Both platforms automatically redeploy when you push to GitHub!

### 🆘 Troubleshooting

**Build Fails?**
- Check build logs in Render/Railway dashboard
- Ensure `requirements.txt` includes all dependencies
- Verify `build.sh` is executable

**Database Issues?**
- Make sure `DATABASE_URL` is set correctly
- Check PostgreSQL connection string format

**Static Files Not Loading?**
- Ensure `STATIC_ROOT` is configured
- Verify WhiteNoise is in `MIDDLEWARE`

**CORS Issues?**
- Update `ALLOWED_HOSTS` in settings
- Check CORS configuration

### 📞 Support

If you run into issues:
1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Contact me for help!

---

## 🎯 Next Steps

1. Deploy backend ✅ 
2. Update React Native app with new URL
3. Test on your phone
4. Add custom domain (optional)
5. Set up monitoring (optional)

Your Jonkech app will be live and accessible from anywhere! 🎉
