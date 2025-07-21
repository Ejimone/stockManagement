# 🚇 ngrok Setup Guide for Django + React Native

## Why ngrok?

ngrok creates a secure tunnel to your local Django server, giving you:

- ✅ **Universal access**: Works on emulator, physical devices, anywhere with internet
- ✅ **HTTPS support**: Secure connections
- ✅ **No network configuration**: No need to worry about IP addresses, firewalls, or WiFi networks
- ✅ **Easy sharing**: Share your development server with others

## Quick Setup (Automatic)

Run the automated setup script:

```bash
./start-ngrok.sh
```

This will:

1. Start Django server if not running
2. Create ngrok tunnel
3. Update your React Native app with the ngrok URL
4. Show you the public URL

## Manual Setup

### 1. Start Django Server

```bash
cd backend
source ../venv/bin/activate
python manage.py runserver
```

### 2. Start ngrok (in new terminal)

```bash
ngrok http 8000
```

You'll see output like:

```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:8000
```

### 3. Update API Configuration

Copy your ngrok URL and update these files:

**frontend/services/api.ts:**

```typescript
// Replace this line:
"https://your-ngrok-url.ngrok-free.app/api/",

// With your actual ngrok URL:
"https://abc123.ngrok-free.app/api/",
```

**frontend/services/connectionDebug.ts:**

```typescript
// Replace this line:
"https://your-ngrok-url.ngrok-free.app/api/",

// With your actual ngrok URL:
"https://abc123.ngrok-free.app/api/",
```

### 4. Test the Connection

Open your browser and visit:

```
https://abc123.ngrok-free.app/api/
```

You should see your Django API response.

### 5. Start React Native App

```bash
cd frontend
npm start
```

## Benefits of ngrok

### Before (Local IP):

- ❌ Only works on same WiFi network
- ❌ Need to configure firewall
- ❌ Different setup for emulator vs physical device
- ❌ IP address changes

### After (ngrok):

- ✅ Works anywhere with internet
- ✅ No firewall configuration needed
- ✅ Same URL for all devices
- ✅ Stable URL during development session

## Testing Your App

With ngrok, your React Native app will:

1. **Try ngrok URL first** (works everywhere)
2. **Fall back to local development** if ngrok unavailable
3. **Show clear connection logs**

Expected logs:

```
🔍 Auto-detecting working API URL...
Testing API endpoint: https://abc123.ngrok-free.app/api/
✅ Found working API URL: https://abc123.ngrok-free.app/api/
📊 API Response: {"message": "Stock Management System API", ...}
```

## Important Notes

### Free Plan Limitations:

- URL changes each time you restart ngrok
- Need to update your app configuration when URL changes
- Some rate limiting

### Security:

- ngrok URLs are public but hard to guess
- Don't use for production
- Keep your ngrok session private

## Troubleshooting

### ngrok URL Not Working:

1. Check if Django server is running on localhost:8000
2. Verify ngrok tunnel is active
3. Try accessing the ngrok URL in your browser first

### App Still Using Old URL:

1. Check if you updated both api.ts and connectionDebug.ts
2. Restart your React Native app
3. Clear React Native cache: `npx react-native start --reset-cache`

## Stop Development

To stop everything:

1. **Stop ngrok**: Ctrl+C in ngrok terminal
2. **Stop Django**: Ctrl+C in Django terminal
3. **Stop React Native**: Ctrl+C in React Native terminal

The automated script (`./start-ngrok.sh`) handles cleanup automatically when you press Ctrl+C.
