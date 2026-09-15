export const environment = {
  production: true,
  apiUrl: 'https://api.pedidos360.com', // Endpoint del API Gateway en Producción
  azure: {
    clientId: 'PRODUCTION_AZURE_CLIENT_ID',
    tenantId: 'PRODUCTION_AZURE_TENANT_ID',
    redirectUri: '/auth/callback',
    postLogoutRedirectUri: '/login',
    apiScope: 'api://pedidos360-api/access_as_user',
    authority: 'https://login.microsoftonline.com/PRODUCTION_AZURE_TENANT_ID'
  },
  enableMockFallback: false,
  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};
