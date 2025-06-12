#!/bin/bash

# Stock Management App - Development Server Starter
echo "🚀 Starting Stock Management App Development Servers..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    echo "🔄 Killing process on port $1..."
    local pid=$(lsof -ti:$1)
    if [ ! -z "$pid" ]; then
        kill -9 $pid
        echo "✅ Killed process $pid on port $1"
    else
        echo "ℹ️ No process found on port $1"
    fi
}

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "🌐 Local IP Address: $LOCAL_IP"

# Check and restart Django backend (port 8000)
echo "🔧 Setting up Django backend..."
if check_port 8000; then
    echo "⚠️ Port 8000 is in use, stopping existing process..."
    kill_port 8000
    sleep 2
fi

echo "🔄 Starting Django backend on 0.0.0.0:8000..."
cd "$(dirname "$0")/backend"
python3 manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
echo "✅ Django backend started (PID: $DJANGO_PID)"

# Wait for Django to start
echo "⏳ Waiting for Django to initialize..."
sleep 5

# Test Django connection
echo "🧪 Testing Django API connection..."
if curl -s "http://$LOCAL_IP:8000/api/" > /dev/null; then
    echo "✅ Django API is accessible at http://$LOCAL_IP:8000/api/"
else
    echo "❌ Django API is not accessible at http://$LOCAL_IP:8000/api/"
    echo "🔍 Checking localhost..."
    if curl -s "http://localhost:8000/api/" > /dev/null; then
        echo "✅ Django API is accessible at http://localhost:8000/api/"
        echo "⚠️ But not accessible via IP address - check firewall/network settings"
    else
        echo "❌ Django API is not accessible at all"
        exit 1
    fi
fi

# Check and setup React Native frontend (port 8081)
echo "🔧 Setting up React Native frontend..."
if check_port 8081; then
    echo "⚠️ Port 8081 is in use, stopping existing process..."
    kill_port 8081
    sleep 2
fi

echo "🔄 Starting React Native frontend..."
cd "$(dirname "$0")/frontend"

# Update API configuration with current IP
echo "📝 Updating API configuration with IP: $LOCAL_IP"
sed -i.bak "s/172\.16\.0\.[0-9]\+/$LOCAL_IP/g" services/api.ts

npm start &
EXPO_PID=$!
echo "✅ React Native frontend started (PID: $EXPO_PID)"

echo ""
echo "🎉 Both servers are starting up!"
echo "📊 Django Backend: http://$LOCAL_IP:8000/api/"
echo "📱 React Native App: http://localhost:8081"
echo ""
echo "📋 Next steps:"
echo "1. Scan the QR code with Expo Go app (Android) or Camera app (iOS)"
echo "2. Or press 'a' for Android emulator, 'i' for iOS simulator, 'w' for web"
echo "3. Try logging in with your credentials"
echo ""
echo "🛑 To stop servers: pkill -f 'manage.py runserver' && pkill -f 'expo start'"
echo ""
echo "⌨️ Press Ctrl+C to stop both servers..."

# Wait for user interrupt
wait
