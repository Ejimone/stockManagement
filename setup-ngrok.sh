#!/bin/bash

# ngrok Setup Script for Stock Management System
# This script helps you set up ngrok for universal backend access

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 ngrok Setup for Stock Management System${NC}"
echo "=============================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if ngrok is installed
if ! command_exists ngrok; then
    echo -e "${RED}❌ ngrok is not installed${NC}"
    echo -e "${YELLOW}Install ngrok:${NC}"
    echo "1. Visit: https://ngrok.com/download"
    echo "2. Or use Homebrew: brew install ngrok"
    echo "3. Sign up for a free account at https://ngrok.com"
    echo "4. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "5. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    exit 1
fi

echo -e "${GREEN}✅ ngrok is installed${NC}"

# Check if Django server is running
echo -e "${BLUE}🔍 Checking Django server...${NC}"
if curl -s http://localhost:8000/api/ > /dev/null; then
    echo -e "${GREEN}✅ Django server is running on localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️ Django server is not running${NC}"
    echo "Starting Django server..."
    
    # Check if we're in the right directory
    if [ ! -d "backend" ]; then
        echo -e "${RED}❌ Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Start Django server in background
    cd backend
    source ../venv/bin/activate 2>/dev/null || echo "No virtual environment found"
    python manage.py runserver 0.0.0.0:8000 &
    DJANGO_PID=$!
    echo -e "${GREEN}📡 Django server started (PID: $DJANGO_PID)${NC}"
    
    # Wait for server to start
    echo "⏳ Waiting for Django server to initialize..."
    sleep 5
    
    # Test again
    if curl -s http://localhost:8000/api/ > /dev/null; then
        echo -e "${GREEN}✅ Django server is now running${NC}"
    else
        echo -e "${RED}❌ Failed to start Django server${NC}"
        exit 1
    fi
    
    cd ..
fi

# Start ngrok tunnel
echo -e "${BLUE}🚀 Starting ngrok tunnel...${NC}"
echo "This will create a secure HTTPS tunnel to your Django server"
echo "The tunnel will work from anywhere - emulator, physical devices, web!"
echo ""

# Kill any existing ngrok processes
pkill -f ngrok 2>/dev/null || true

# Start ngrok in background and capture output
echo -e "${YELLOW}⏳ Creating ngrok tunnel...${NC}"
ngrok http 8000 --log=stdout &
NGROK_PID=$!

# Wait for ngrok to initialize
sleep 3

# Get the ngrok URL
echo -e "${BLUE}🔍 Retrieving ngrok URL...${NC}"
NGROK_URL=""
for i in {1..10}; do
    # Try to get the public URL from ngrok API
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    echo "Waiting for ngrok to start... ($i/10)"
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    echo "Please check if ngrok is properly configured with an auth token"
    echo "Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

# Make sure we have HTTPS URL
if [[ $NGROK_URL == http://* ]]; then
    HTTPS_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$HTTPS_URL" ]; then
        NGROK_URL=$HTTPS_URL
    fi
fi

echo -e "${GREEN}✅ ngrok tunnel created successfully!${NC}"
echo -e "${BLUE}🌐 Public URL: ${NGROK_URL}${NC}"
echo -e "${BLUE}📱 API URL: ${NGROK_URL}/api/${NC}"

# Test the ngrok URL
echo -e "${BLUE}🧪 Testing ngrok connection...${NC}"
if curl -s "${NGROK_URL}/api/" > /dev/null; then
    echo -e "${GREEN}✅ ngrok tunnel is working perfectly!${NC}"
else
    echo -e "${YELLOW}⚠️ ngrok tunnel created but API test failed${NC}"
    echo "This might be due to Django ALLOWED_HOSTS configuration"
fi

# Update the frontend API configuration
echo -e "${BLUE}📝 Updating frontend API configuration...${NC}"
API_FILE="frontend/services/api.ts"

if [ -f "$API_FILE" ]; then
    # Create backup
    cp "$API_FILE" "$API_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update the ngrok URL in the file
    sed -i.tmp "s|const ngrokUrl = \".*\";|const ngrokUrl = \"${NGROK_URL}/api/\";|g" "$API_FILE"
    rm "$API_FILE.tmp" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Frontend API configuration updated${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend API file not found: $API_FILE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ngrok Setup Complete!${NC}"
echo "================================"
echo -e "${BLUE}📡 ngrok URL: ${NGROK_URL}${NC}"
echo -e "${BLUE}🔗 API Endpoint: ${NGROK_URL}/api/${NC}"
echo -e "${BLUE}📊 ngrok Dashboard: http://localhost:4040${NC}"
echo ""
echo -e "${YELLOW}📱 This URL works on:${NC}"
echo "  ✅ Android Emulator"
echo "  ✅ Physical Android Devices"
echo "  ✅ iOS Simulator"
echo "  ✅ Physical iOS Devices"
echo "  ✅ Web Browser"
echo "  ✅ Any device with internet access!"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Start your React Native app: cd frontend && npm start"
echo "2. The app will automatically use the ngrok URL"
echo "3. Test on any device - it should work everywhere!"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo "  Kill ngrok: kill $NGROK_PID"
echo "  Stop Django: pkill -f 'manage.py runserver'"
echo ""
echo -e "${BLUE}💡 Tip: Keep this terminal open to see ngrok logs${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down ngrok tunnel...${NC}"
    kill $NGROK_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Keep the script running to maintain ngrok tunnel
echo -e "${YELLOW}📡 ngrok tunnel is running... Press Ctrl+C to stop${NC}"
wait $NGROK_PID
