#!/bin/bash

# Azure deployment script for Django Stock Management App

set -e

echo "🚀 Starting Azure deployment..."

# Variables
RESOURCE_GROUP="rg-stock-management-app"
LOCATION="eastus"
APP_SERVICE_PLAN="asp-stock-management"
APP_SERVICE_NAME="stock-management-api-$(date +%s)"
PYTHON_VERSION="3.11"

# Login to Azure (if not already logged in)
echo "📝 Checking Azure login..."
az account show || az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan
echo "📋 Creating App Service Plan..."
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_PLAN \
  --is-linux \
  --sku B1

# Create App Service
echo "🌐 Creating App Service..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $APP_SERVICE_NAME \
  --runtime "PYTHON|$PYTHON_VERSION" \
  --startup-file "startup.sh"

# Configure App Service settings
echo "⚙️ Configuring App Service settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    DJANGO_SETTINGS_MODULE=backend.settings \
    DEBUG=False \
    SECRET_KEY="$(openssl rand -base64 32)" \
    FIREBASE_API_KEY="AIzaSyBYTTmzpaeOf-IiNAze0GwHFmswHKbcKKw" \
    FIREBASE_AUTH_DOMAIN="opecode-9e47b.firebaseapp.com" \
    FIREBASE_PROJECT_ID="opecode-9e47b" \
    FIREBASE_STORAGE_BUCKET="opecode-9e47b.firebasestorage.app" \
    FIREBASE_MESSAGING_SENDER_ID="171791860064" \
    FIREBASE_APP_ID="1:171791860064:web:4a08a49bb7df7d27ca5e05" \
    FIREBASE_MEASUREMENT_ID="G-PP81X1N21M"

# Deploy the code
echo "🚀 Deploying code..."
cd backend
zip -r ../deployment.zip . -x "*.git*" "*__pycache__*" "*.pyc" "venv/*" "logs/*" "db.sqlite3"
cd ..

az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --src-path deployment.zip \
  --type zip

# Get the app URL
APP_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME --query "defaultHostName" -o tsv)

echo "✅ Deployment completed successfully!"
echo "🌐 Your Django API is now available at: https://$APP_URL"
echo "📊 API Base URL: https://$APP_URL/api/"
echo ""
echo "🔗 Important URLs:"
echo "   - API Root: https://$APP_URL/api/"
echo "   - Django Admin: https://$APP_URL/admin/"
echo "   - Health Check: https://$APP_URL/api/health/"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend API URL to: https://$APP_URL/api/"
echo "2. Access the Django admin at: https://$APP_URL/admin/"
echo "3. Monitor logs with: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME"

# Clean up
rm -f deployment.zip

echo "🎉 Deployment complete!"
