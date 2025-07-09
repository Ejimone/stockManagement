targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Id of the user or app to assign application roles')
param principalId string

@description('Resource token to make resource names unique')
param resourceToken string = toLower(uniqueString(resourceGroup().id, environmentName, location))

// Optional parameters
@description('Name of the app service plan. If empty, a name will be generated.')
param appServicePlanName string = ''

@description('Name of the app service. If empty, a name will be generated.')
param appServiceName string = ''

@description('Name of the Application Insights resource. If empty, a name will be generated.')
param applicationInsightsName string = ''

@description('Name of the Log Analytics workspace. If empty, a name will be generated.')
param logAnalyticsWorkspaceName string = ''

@description('Name of the Key Vault. If empty, a name will be generated.')
param keyVaultName string = ''

var tags = {
  'azd-env-name': environmentName
}

// Generate resource names
var appServicePlanNameResolved = !empty(appServicePlanName) ? appServicePlanName : 'asp-${resourceToken}'
var appServiceNameResolved = !empty(appServiceName) ? appServiceName : 'app-${resourceToken}'
var applicationInsightsNameResolved = !empty(applicationInsightsName) ? applicationInsightsName : 'ai-${resourceToken}'
var logAnalyticsWorkspaceNameResolved = !empty(logAnalyticsWorkspaceName) ? logAnalyticsWorkspaceName : 'law-${resourceToken}'
var keyVaultNameResolved = !empty(keyVaultName) ? keyVaultName : 'kv-${resourceToken}'

// Log Analytics workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceNameResolved
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsNameResolved
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultNameResolved
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: principalId
        permissions: {
          secrets: ['get', 'set', 'list', 'delete']
        }
      }
    ]
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanNameResolved
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceNameResolved
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
  })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      alwaysOn: true
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'AZURE_KEY_VAULT_ENDPOINT'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'DJANGO_SETTINGS_MODULE'
          value: 'backend.settings'
        }
      ]
    }
    httpsOnly: true
  }
}

// Role assignment to allow App Service to access Key Vault
resource keyVaultAccessPolicy 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appService.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    principalId: appService.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalType: 'ServicePrincipal'
  }
}

// Output the API endpoint and other important information
output API_BASE_URL string = 'https://${appService.properties.defaultHostName}/api/'
output APPLICATIONINSIGHTS_CONNECTION_STRING string = applicationInsights.properties.ConnectionString
output AZURE_KEY_VAULT_ENDPOINT string = keyVault.properties.vaultUri
output AZURE_KEY_VAULT_NAME string = keyVault.name
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = subscription().tenantId
