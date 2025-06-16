 #!/bin/bash

# Quick ngrok URL updater
# Use this when you have a new ngrok URL and want to update your React Native app

if [ $# -eq 0 ]; then
    echo "Usage: $0 <ngrok-url>"
    echo "Example: $0 https://abc123.ngrok-free.app"
    exit 1
fi

NGROK_URL="$1"

# Remove trailing slash if present
NGROK_URL=$(echo "$NGROK_URL" | sed 's/\/$//')

echo "🔄 Updating React Native app with ngrok URL: $NGROK_URL"

# Update api.ts
API_FILE="frontend/services/api.ts"
if [ -f "$API_FILE" ]; then
    # Create backup
    cp "$API_FILE" "$API_FILE.bak"
    
    # Replace the placeholder URL
    sed -i '' "s|https://your-ngrok-url.ngrok-free.app|$NGROK_URL|g" "$API_FILE"
    
    # Also replace any existing ngrok URLs
    sed -i '' "s|https://[a-zA-Z0-9.-]*\.ngrok-free\.app|$NGROK_URL|g" "$API_FILE"
    
    echo "✅ Updated $API_FILE"
else
    echo "❌ Could not find $API_FILE"
fi

# Update connectionDebug.ts
DEBUG_FILE="frontend/services/connectionDebug.ts"
if [ -f "$DEBUG_FILE" ]; then
    # Create backup
    cp "$DEBUG_FILE" "$DEBUG_FILE.bak"
    
    # Replace the placeholder URL
    sed -i '' "s|https://your-ngrok-url.ngrok-free.app|$NGROK_URL|g" "$DEBUG_FILE"
    
    # Also replace any existing ngrok URLs
    sed -i '' "s|https://[a-zA-Z0-9.-]*\.ngrok-free\.app|$NGROK_URL|g" "$DEBUG_FILE"
    
    echo "✅ Updated $DEBUG_FILE"
else
    echo "❌ Could not find $DEBUG_FILE"
fi

echo ""
echo "🎉 Update complete!"
echo "📱 Your React Native app will now use: $NGROK_URL/api/"
echo ""
echo "🧪 Test the connection:"
echo "   curl $NGROK_URL/api/"
echo ""
echo "📋 Next steps:"
echo "1. Restart your React Native app (if running)"
echo "2. The app should now connect to your ngrok URL"
