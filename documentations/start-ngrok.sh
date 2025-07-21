#!/bin/bash

# ngrok Django Development Setup
# This script starts ngrok tunnel and updates the React Native app with the correct URL

echo "🚇 Setting up ngrok tunnel for Django backend..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed${NC}"
    echo "Install it with: brew install ngrok"
    echo "Or download from: https://ngrok.com/download"
    exit 1
fi

# Check if Django server is running
if ! curl -s http://localhost:8000/api/ > /dev/null; then
    echo -e "${YELLOW}⚠️  Django server not detected on localhost:8000${NC}"
    echo "Starting Django server first..."
    
    # Start Django server in background
    cd backend
    source ../venv/bin/activate
    python manage.py runserver &
    DJANGO_PID=$!
    cd ..
    
    # Wait for Django to start
    echo "⏳ Waiting for Django to start..."
    sleep 5
    
    if ! curl -s http://localhost:8000/api/ > /dev/null; then
        echo -e "${RED}❌ Failed to start Django server${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Django server started successfully${NC}"
fi

echo -e "${GREEN}✅ Django server is running on localhost:8000${NC}"

# Start ngrok tunnel in background
echo -e "${BLUE}🚇 Starting ngrok tunnel...${NC}"
ngrok http 8000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to establish tunnel..."
sleep 3

# Extract ngrok URL from the log
NGROK_URL=""
for i in {1..10}; do
    if [ -f ngrok.log ]; then
        NGROK_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.app' ngrok.log | head -1)
        if [ ! -z "$NGROK_URL" ]; then
            break
        fi
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    echo "Check ngrok.log for details"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ ngrok tunnel established!${NC}"
echo -e "${BLUE}📡 Public URL: $NGROK_URL${NC}"
echo -e "${BLUE}🔗 API URL: $NGROK_URL/api/${NC}"

# Update the React Native API configuration
echo -e "${YELLOW}📝 Updating React Native API configuration...${NC}"

# Update api.ts with the new ngrok URL
API_FILE="frontend/services/api.ts"
if [ -f "$API_FILE" ]; then
    # Replace the placeholder ngrok URL with the actual one
    sed -i.bak "s|https://your-ngrok-url.ngrok-free.app|$NGROK_URL|g" "$API_FILE"
    echo -e "${GREEN}✅ Updated $API_FILE with ngrok URL${NC}"
else
    echo -e "${RED}❌ Could not find $API_FILE${NC}"
fi

# Update connectionDebug.ts as well
DEBUG_FILE="frontend/services/connectionDebug.ts"
if [ -f "$DEBUG_FILE" ]; then
    # Add ngrok URL to the test URLs if not already present
    if ! grep -q "$NGROK_URL" "$DEBUG_FILE"; then
        # Create a backup and add ngrok URL at the top of the URL list
        cp "$DEBUG_FILE" "$DEBUG_FILE.bak"
        sed -i '' "s|// Physical device URLs|// ngrok URLs (work everywhere!)\n    \"$NGROK_URL/api/\", // ngrok tunnel\n    \"$NGROK_URL/\", // ngrok base\n    \n    // Physical device URLs|" "$DEBUG_FILE"
        echo -e "${GREEN}✅ Updated $DEBUG_FILE with ngrok URL${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "==================="
echo -e "${BLUE}🌐 Your Django API is now accessible from anywhere!${NC}"
echo ""
echo -e "${YELLOW}📱 URLs for testing:${NC}"
echo "   Public API: $NGROK_URL/api/"
echo "   Admin: $NGROK_URL/admin/"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Start your React Native app: cd frontend && npm start"
echo "2. The app will automatically use the ngrok URL"
echo "3. Works on emulator, physical device, anywhere with internet!"
echo ""
echo -e "${YELLOW}🧪 Test the connection:${NC}"
echo "   curl $NGROK_URL/api/"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Keep this terminal open (ngrok tunnel will stay active)"
echo "   - ngrok URL changes each time you restart (free plan)"
echo "   - Re-run this script if you restart ngrok"
echo ""
echo -e "${BLUE}🛑 To stop: Press Ctrl+C${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping ngrok tunnel...${NC}"
    kill $NGROK_PID 2>/dev/null
    
    # Restore original API files
    if [ -f "$API_FILE.bak" ]; then
        mv "$API_FILE.bak" "$API_FILE"
        echo -e "${GREEN}✅ Restored original API configuration${NC}"
    fi
    
    if [ -f "$DEBUG_FILE.bak" ]; then
        mv "$DEBUG_FILE.bak" "$DEBUG_FILE"
        echo -e "${GREEN}✅ Restored original debug configuration${NC}"
    fi
    
    # Clean up log file
    rm -f ngrok.log
    
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Keep the script running
echo -e "${BLUE}🔄 ngrok tunnel is active. Press Ctrl+C to stop...${NC}"
wait $NGROK_PID
