export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  azure: {
    clientId: '00000000-0000-0000-0000-000000000000',
    tenantId: '00000000-0000-0000-0000-000000000000',
    redirectUri: '/auth/callback',
    postLogoutRedirectUri: '/login',
    apiScope: 'api://pedidos360-api/access_as_user',
    authority: 'https://login.microsoftonline.com/common'
  },
  enableMockFallback: true,
  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};
