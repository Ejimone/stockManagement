# 🔧 Physical Device Connection Fix

## The Issue

**Physical Android devices** cannot connect to `localhost`, `127.0.0.1`, or `10.0.2.2` because these addresses only work within emulator environments.

## The Solution

Your Django server must be accessible via your computer's **local network IP address**.

## What Was Fixed

### 1. Django Server Configuration ✅

- **Before**: Running on `127.0.0.1:8000` (localhost only)
- **After**: Running on `0.0.0.0:8000` (all network interfaces)

### 2. API URL Priority ✅

- **Before**: Prioritized emulator addresses first
- **After**: Prioritizes local IP address for physical devices

### 3. Enhanced Debugging ✅

- Added specific guidance for physical device troubleshooting
- Increased timeout for physical device connections
- Better error messages and suggestions

## Current Working Setup

### Django Server

```bash
python manage.py runserver 0.0.0.0:8000
```

- **Accessible from computer**: `http://localhost:8000/api/`
- **Accessible from phone**: `http://172.16.0.59:8000/api/`

### React Native App URL Priority

1. `http://172.16.0.59:8000/api/` - **Your local IP (for physical devices)**
2. `http://10.0.2.2:8000/api/` - Android Emulator
3. `http://localhost:8000/api/` - iOS Simulator, Web
4. `http://127.0.0.1:8000/api/` - Alternative localhost

## Testing Steps

### 1. Verify Django Server

```bash
./test-device-connection.sh
```

### 2. Test from Phone Browser

Open your phone's web browser and visit:

```
http://172.16.0.59:8000/api/
```

You should see JSON data with API information.

### 3. Test React Native App

The app will now automatically:

- Try your local IP first (best for physical devices)
- Show detailed connection logs
- Fall back to emulator addresses if needed

## Important Requirements

### ✅ Same WiFi Network

Your computer and phone **must be on the same WiFi network**.

### ✅ Firewall Configuration

Port 8000 must be accessible through your computer's firewall.

**macOS Firewall Check:**

1. System Preferences → Security & Privacy → Firewall
2. Make sure Django/Python is allowed
3. Or temporarily disable firewall for testing

### ✅ Correct Server Binding

Always start Django with:

```bash
python manage.py runserver 0.0.0.0:8000
```

**NOT:**

```bash
python manage.py runserver  # This defaults to 127.0.0.1
```

## Quick Start Commands

### Terminal 1 - Backend

```bash
cd backend
source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Terminal 2 - Frontend

```bash
cd frontend
npm start
```

## Troubleshooting

### If phone still can't connect:

1. **Verify IP Address**: Your IP might have changed

   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Test from Phone Browser**: Visit `http://172.16.0.59:8000/api/`

3. **Check Firewall**: Temporarily disable macOS firewall

4. **Verify Same Network**: Both devices on same WiFi

5. **Update IP in Code**: If your IP changed, update the IP in:
   - `frontend/services/api.ts`
   - `frontend/services/connectionDebug.ts`

## Expected App Logs (Success)

```
🔍 Auto-detecting working API URL...
📱 Platform: android
Testing API endpoint: http://172.16.0.59:8000/api/
✅ Found working API URL: http://172.16.0.59:8000/api/
📊 API Response: {"message": "Stock Management System API", ...}
```

Your app should now work perfectly on both Android emulator and physical Android devices!
