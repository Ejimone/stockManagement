#!/bin/bash

# 🚀 Quick Start Script for ngrok-only Development
# This script starts everything you need for development

echo "🎯 Starting Stock Management System with ngrok-only configuration..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found! Please install ngrok first:"
    echo "   https://ngrok.com/download"
    exit 1
fi

# Check if Django server is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "⚠️ Django server not running on port 8000"
    echo "💡 Start Django server first:"
    echo "   cd backend && python3 manage.py runserver 0.0.0.0:8000"
    echo ""
    read -p "Press Enter when Django server is running..."
fi

# Start ngrok tunnel
echo "🔗 Starting ngrok tunnel..."
echo "💡 Keep this terminal open - ngrok must stay running"
echo ""

# Start ngrok in background and show URL
ngrok http 8000 &
NGROK_PID=$!

# Wait a moment for ngrok to start
sleep 3

# Update frontend configuration
echo "🔄 Updating frontend configuration..."
if [ -f "./update-ngrok-config.sh" ]; then
    ./update-ngrok-config.sh
else
    echo "⚠️ update-ngrok-config.sh not found in current directory"
fi

echo ""
echo "🧪 Testing ngrok connection..."
if [ -f "./test-ngrok-complete.js" ]; then
    node test-ngrok-complete.js
else
    echo "⚠️ test-ngrok-complete.js not found"
fi

echo ""
echo "🎉 Setup complete! Your system is ready for development."
echo ""
echo "Next steps:"
echo "1. Start React Native: cd frontend && npx expo start"  
echo "2. Scan QR code with Expo Go on any device"
echo "3. Your app will connect via ngrok - works everywhere! 🌍"
echo ""
echo "🛑 To stop: Press Ctrl+C to stop ngrok tunnel"

# Keep ngrok running
wait $NGROK_PID
