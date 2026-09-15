export const environment = {
  production: true,
  apiUrl: 'https://xyz123.execute-api.us-east-1.amazonaws.com/prod', // Cambiar por tu URL de API Gateway

  azure: {
    clientId: '51cf1b17-3d4f-4732-8956-69caff42b99c',
    tenantId: 'dbab308c-779c-43d0-a679-5ff97d363793',
    redirectUri: 'http://TU-IP-PUBLICA-EC2', // Cambiar por la IP pública de tu EC2
    postLogoutRedirectUri: 'http://TU-IP-PUBLICA-EC2', // Cambiar por la IP pública de tu EC2
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

  enableMockFallback: false,

  // Propiedad requerida por tus servicios
  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};