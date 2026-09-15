export const environment = {
  production: false,

  // URL base apuntando al stage/prefix v1
  apiUrl: 'https://k97pn6x7s4.execute-api.us-east-1.amazonaws.com/api/v1',
  
  azure: {
    clientId: '51cf1b17-3d4f-4732-8956-69caff42b99c',
    tenantId: 'dbab308c-779c-43d0-a679-5ff97d363793',
    redirectUri: 'http://localhost:3000',
    postLogoutRedirectUri: 'http://localhost:3000',
    authority: 'https://login.microsoftonline.com/dbab308c-779c-43d0-a679-5ff97d363793',
    apiScope: 'api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create',
    scopes: [
      'openid',
      'profile',
      'email',
      'api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create'
    ]
  },

  // Interceptor de MSAL: Se agrega /v1/* para interceptar las peticiones versionadas
  protectedResources: {
    apiGateway: {
      endpoint: 'https://k97pn6x7s4.execute-api.us-east-1.amazonaws.com/api/v1/*',
      scopes: ['api://0348da87-2030-4cea-9702-9290bc25ddb7/OT.Create']
    }
  },

  // Cambiado a true para que el Dashboard no reviente buscando servicios que no existen
  enableMockFallback: false,

  // Se eliminó el prefijo '/api' repetido
  apiEndpoints: {
    orders: '/orders',
    catalog: '/catalog',
    audit: '/audit',
    report: '/report'
  }
};