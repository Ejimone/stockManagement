#!/bin/bash

# Update frontend API URL after deployment

if [ -z "$1" ]; then
    echo "Usage: $0 <deployed-api-url>"
    echo "Example: $0 https://stock-management-api.onrender.com"
    exit 1
fi

DEPLOYED_URL="$1"
API_URL="${DEPLOYED_URL}/api/"

echo "🔄 Updating frontend API URL..."
echo "New API URL: $API_URL"

# Update the API URL in the frontend
sed -i.bak "s|const ngrokUrl = \"https://dfe89b0b8408.ngrok-free.app/api/\";|const productionUrl = \"$API_URL\";|g" frontend/services/api.ts

# Update the variable name references
sed -i.bak "s|ngrokUrl|productionUrl|g" frontend/services/api.ts

# Update the console log message
sed -i.bak "s|Using ngrok-only configuration|Using production API|g" frontend/services/api.ts

echo "✅ Frontend API URL updated successfully!"
echo "📝 Updated file: frontend/services/api.ts"
echo ""
echo "🔄 Next steps:"
echo "1. Test the frontend with the new API URL"
echo "2. If everything works, commit the changes:"
echo "   git add frontend/services/api.ts"
echo "   git commit -m \"Update API URL to production\""
echo "   git push"
