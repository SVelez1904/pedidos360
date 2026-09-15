export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',

  azure: {
    clientId: '51cf1b17-3d4f-4732-8956-69caff42b99c',
    tenantId: 'dbab308c-779c-43d0-a679-5ff97d363793',
    redirectUri: 'http://localhost:3000',
    postLogoutRedirectUri: 'http://localhost:3000',
    authority: 'https://login.microsoftonline.com/dbab308c-779c-43d0-a679-5ff97d363793',

    // Scope completo con el prefijo URI
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
      endpoint: 'http://localhost:8080/api/*',
      scopes: ['api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create']
    }
  },

  enableMockFallback: false,

  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};