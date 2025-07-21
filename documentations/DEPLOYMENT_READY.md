# 🎯 Django Backend Deployment - Complete Guide

## 🚀 **RECOMMENDED: Deploy to Render.com (FREE)**

### Quick Start Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to Render.com**:
   - Visit [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**:
   - **Name**: `stock-management-api`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Branch**: `main`

4. **Build & Deploy Commands**:
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**: 
     ```bash
     gunicorn backend.wsgi:application
     ```

5. **Environment Variables** (copy-paste these in Render dashboard):
   ```
   SECRET_KEY=^1s$h!7ju7a^fjc%yz!_o%a)&lq&zn_sx%w7$-2()yzj!fi4&x
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

6. **Deploy**: Click "Create Web Service" and wait 5-10 minutes

---

## 📱 **After Deployment: Update Frontend**

Once deployed, you'll get a URL like: `https://stock-management-api.onrender.com`

### Update Frontend API URL:
```bash
# Use the provided script
./update-frontend-api.sh https://stock-management-api.onrender.com
```

Or manually update `frontend/services/api.ts`:
```typescript
const getInitialApiBaseUrl = (): string => {
  const productionUrl = "https://your-deployed-app.onrender.com/api/";
  
  console.log("🌐 Using production API:", productionUrl);
  return productionUrl;
};
```

---

## 🔗 **Important URLs After Deployment**

- **API Root**: `https://your-app.onrender.com/api/`
- **Django Admin**: `https://your-app.onrender.com/admin/`
- **Health Check**: `https://your-app.onrender.com/api/health/`

---

## 🐛 **Troubleshooting**

### If deployment fails:
1. **Check build logs** in Render dashboard
2. **Verify requirements.txt** is in backend folder
3. **Check Python version** compatibility
4. **Verify Django settings** for production

### Common fixes:
- **Static files**: Already handled by `collectstatic`
- **Database**: SQLite works fine for development
- **Environment variables**: Double-check all Firebase keys

---

## 🎉 **Success Checklist**

- [ ] Code pushed to GitHub
- [ ] Render service created and configured
- [ ] Environment variables added
- [ ] Build completed successfully
- [ ] API accessible at deployed URL
- [ ] Frontend API URL updated
- [ ] Stock management app working end-to-end

---

## 📞 **Support**

If you encounter issues:
1. Check the **build logs** in Render dashboard
2. Verify all **environment variables** are set correctly
3. Test the **API endpoints** directly in browser
4. Check Django **DEBUG=False** is working

---

## 💡 **Next Steps**

1. **Custom Domain**: Add your own domain in Render
2. **SSL Certificate**: Automatic with Render
3. **Database**: Upgrade to PostgreSQL if needed
4. **Monitoring**: Set up health checks
5. **Scaling**: Render auto-scales with traffic

---

## 🔄 **Alternative Options**

If Render doesn't work:
- **Railway.app**: Similar process, $5/month free tier
- **Heroku**: Paid but reliable
- **Azure App Service**: We can retry once MFA is resolved

---

**🎯 Your Django stock management API is ready for deployment!**

   ```
   SECRET_KEY=qykplipj*h%)u54^xjf(m&k&t(@)op*dpi5*6xlle95v8s)n^m
   DEBUG=False
   FIREBASE_API_KEY=AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw
   FIREBASE_AUTH_DOMAIN=opecode-9e47b.firebaseapp.com
   FIREBASE_PROJECT_ID=opecode-9e47b
   FIREBASE_STORAGE_BUCKET=opecode-9e47b.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=171791860064
   FIREBASE_APP_ID=1:171791860064:web:4a08a49bb7df7d27ca5e05
   FIREBASE_MEASUREMENT_ID=G-PP81X1N21M
   ```

5. **Optional: Add PostgreSQL Database**

   - In Render, create a new PostgreSQL database
   - Add the `DATABASE_URL` environment variable

6. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your API will be live at: `https://your-app-name.onrender.com`

### Option 2: Railway.app (Alternative)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `backend`
6. Add the same environment variables
7. Deploy!

## 📱 Update Your React Native App

After deployment, update your frontend's API URL:

```javascript
// In your React Native app configuration
const API_BASE_URL = "https://your-app-name.onrender.com";
// Replace with your actual deployment URL
```

## 🔍 Test Your Deployed API

Once deployed, test it:

```bash
curl https://your-app-name.onrender.com/api/auth/login/
```

## 🎉 You're Almost Done!

1. ✅ Backend deployment ready
2. 🔄 Deploy to cloud platform (5-10 minutes)
3. 📱 Update React Native app with new URL
4. 📱 Download React Native app to your phone
5. 🚀 Test everything works!

## 💡 Pro Tips:

- **Free Tiers**: Both Render and Railway offer generous free tiers
- **Monitoring**: Check logs in the platform dashboard
- **Updates**: Any git push to main will auto-deploy
- **Custom Domain**: You can add your own domain later

## 🆘 Need Help?

- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Run `./backend/deploy_helper.sh` to verify everything is ready
- The deployment platforms have excellent documentation

**Your Jonkech stock management system is ready to go live! 🎊**
