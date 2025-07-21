#!/bin/bash

# Device Connection Test Script
# Run this script to verify your setup for physical device development

echo "🔧 Django Server Setup for Physical Device Development"
echo "=================================================="

# Get current IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📍 Your computer's IP address: $LOCAL_IP"

# Check if Django server is running
echo "🔍 Checking Django server status..."

# Test localhost access
if curl -s http://localhost:8000/api/ > /dev/null; then
    echo "✅ Django server is running on localhost"
else
    echo "❌ Django server is NOT running on localhost"
    echo "   Start it with: python manage.py runserver 0.0.0.0:8000"
    exit 1
fi

# Test local IP access
if curl -s http://$LOCAL_IP:8000/api/ > /dev/null; then
    echo "✅ Django server is accessible via local IP ($LOCAL_IP)"
    echo "📱 Your phone should be able to connect to: http://$LOCAL_IP:8000/api/"
else
    echo "❌ Django server is NOT accessible via local IP ($LOCAL_IP)"
    echo "   Make sure you started it with: python manage.py runserver 0.0.0.0:8000"
    echo "   (Note the 0.0.0.0 instead of 127.0.0.1)"
    exit 1
fi

echo ""
echo "🎯 Device Connection Instructions:"
echo "================================="
echo "1. ✅ Django server is properly configured"
echo "2. 📱 Make sure your phone and computer are on the same WiFi network"
echo "3. 🔥 Check your firewall settings - port 8000 should be accessible"
echo "4. 📲 In your React Native app, it should connect to: http://$LOCAL_IP:8000/api/"
echo ""
echo "🧪 Quick Test from Phone:"
echo "========================="
echo "Open a web browser on your phone and visit:"
echo "http://$LOCAL_IP:8000/api/"
echo ""
echo "You should see JSON data with API information."
echo ""
echo "🔧 Troubleshooting:"
echo "=================="
echo "If your phone can't connect:"
echo "- Verify both devices are on the same WiFi"
echo "- Check macOS Firewall: System Preferences → Security & Privacy → Firewall"
echo "- Try disabling firewall temporarily for testing"
echo "- Your IP might have changed if you disconnected/reconnected to WiFi"
