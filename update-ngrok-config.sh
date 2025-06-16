#!/bin/bash

# Quick ngrok URL updater for ngrok-only configuration
# Run this script with your new ngrok URL or let it auto-detect

NGROK_URL=""
API_FILE="frontend/services/api.ts"
DEBUG_FILE="frontend/services/connectionDebug.ts"

# If no argument provided, try to auto-detect from ngrok
if [ $# -eq 0 ]; then
    echo "🔍 Auto-detecting ngrok URL..."
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$NGROK_URL" ]; then
        echo "❌ No ngrok tunnel found. Make sure ngrok is running:"
        echo "   ngrok http 8000"
        echo ""
        echo "Or manually specify the URL:"
        echo "   $0 https://your-ngrok-url.ngrok-free.app"
        exit 1
    fi
    
    echo "✅ Detected ngrok URL: $NGROK_URL"
else
    NGROK_URL=$1
    echo "📡 Using provided URL: $NGROK_URL"
fi

# Remove trailing slash if present
NGROK_URL=$(echo "$NGROK_URL" | sed 's/\/$//')

# Add /api/ suffix
NGROK_API_URL="${NGROK_URL}/api/"

echo "🔧 Updating ngrok-only configuration..."
echo "📡 New API URL: $NGROK_API_URL"

if [ ! -f "$API_FILE" ]; then
    echo "❌ API file not found: $API_FILE"
    exit 1
fi

if [ ! -f "$DEBUG_FILE" ]; then
    echo "❌ Debug file not found: $DEBUG_FILE"
    exit 1
fi

# Create backups
cp "$API_FILE" "$API_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$DEBUG_FILE" "$DEBUG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Update the ngrok URL in the ngrok-only configuration
sed -i.tmp "s|const ngrokUrl = \".*\";|const ngrokUrl = \"${NGROK_API_URL}\";|g" "$API_FILE"

# Also update in detectWorkingApiUrl function
sed -i.tmp "s|const ngrokUrl = \"https://.*\.ngrok[^\"]*\";|const ngrokUrl = \"${NGROK_API_URL}\";|g" "$API_FILE"

# Update the ngrok URL in connectionDebug.ts
sed -i.tmp "s|const CURRENT_NGROK_URL = \".*\";|const CURRENT_NGROK_URL = \"${NGROK_API_URL}\";|g" "$DEBUG_FILE"

# Clean up temp files
rm "$API_FILE.tmp" 2>/dev/null || true
rm "$DEBUG_FILE.tmp" 2>/dev/null || true

echo "✅ ngrok-only configuration updated!"
echo "📱 Both api.ts and connectionDebug.ts now use: $NGROK_API_URL"
echo ""
echo "🧪 Test the URL:"
echo "curl $NGROK_API_URL"
echo ""
echo "🔄 Restart your React Native app to pick up the new URL"
