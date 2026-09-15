export const environment = {
  production: true,
  // 1. La URL pública de tu API Gateway en AWS
  apiUrl: 'https://xyz123.execute-api.us-east-1.amazonaws.com/prod',

  azure: {
    clientId: '51cf1b17-3d4f-4732-8956-69caff42b99c',
    tenantId: 'dbab308c-779c-43d0-a679-5ff97d363793',
    
    // 2. La IP Pública o DNS de tu instancia EC2
    redirectUri: 'http://TU-IP-PUBLICA-EC2',
    postLogoutRedirectUri: 'http://TU-IP-PUBLICA-EC2',
    
    authority: 'https://login.microsoftonline.com/dbab308c-779c-43d0-a679-5ff97d363793',
    apiScope: 'api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create',
    scopes: [
      'openid',
      'profile',
      'email',
      'api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create'
    ]
  },

  protectedResources: {
    apiGateway: {
      endpoint: 'https://xyz123.execute-api.us-east-1.amazonaws.com/prod/api/*',
      scopes: ['api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create']
    }
  },

  enableMockFallback: false
};