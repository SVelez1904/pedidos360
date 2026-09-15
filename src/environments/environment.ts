export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  azure: {
    clientId: '00000000-0000-0000-0000-000000000000', // Reemplazar con AZURE_CLIENT_ID real
    tenantId: '00000000-0000-0000-0000-000000000000', // Reemplazar con AZURE_TENANT_ID real
    redirectUri: '/auth/callback',
    postLogoutRedirectUri: '/login',
    apiScope: 'api://pedidos360-api/access_as_user',
    authority: 'https://login.microsoftonline.com/common'
  },
  // Habilita mocks interactivos cuando el backend o Azure AD no estén disponibles en preview local
  enableMockFallback: true,
  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};
