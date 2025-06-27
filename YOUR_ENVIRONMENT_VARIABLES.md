# 🔐 Your Production Environment Variables

## Copy these EXACT values into your deployment platform:

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

## 📋 How to Add These in Render.com:

1. Go to your Render.com dashboard
2. Select your web service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable one by one:
   - **Key**: `SECRET_KEY`
   - **Value**: `qykplipj*h%)u54^xjf(m&k&t(@)op*dpi5*6xlle95v8s)n^m`
   
   - **Key**: `DEBUG`
   - **Value**: `False`
   
   - **Key**: `FIREBASE_API_KEY`
   - **Value**: `AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw`
   
   - And so on for each variable...

6. Click "Save Changes"
7. Your service will automatically redeploy

## 🔄 Alternative: Bulk Add (if platform supports it)

Some platforms allow you to paste all variables at once in this format:

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

## ⚠️ Important Security Notes:

- **NEVER** commit these values to Git
- **NEVER** share the SECRET_KEY publicly
- These values are safe to use in your deployment platform's environment variables section
- If you suspect the SECRET_KEY is compromised, generate a new one using:
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```

## ✅ Your SECRET_KEY Explained:

The SECRET_KEY `qykplipj*h%)u54^xjf(m&k&t(@)op*dpi5*6xlle95v8s)n^m` was generated using Django's built-in secure random generator. It's:

- 50 characters long
- Contains letters, numbers, and special characters
- Cryptographically secure
- Unique to your application

This key is used by Django for:
- Session security
- Password hashing
- CSRF protection
- Cryptographic signing

**Keep it secret and secure!** 🔒
