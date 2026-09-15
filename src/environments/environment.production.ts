export const environment = {
  production: true,
  apiUrl: 'https://api.pedidos360.com', // Reemplazar con el dominio real de producción cuando exista

  azure: {
    // En producción se suele usar el mismo TenantId, pero con las URLs reales de la App
    clientId: '51cf1b17-3d4f-4732-8956-69caff42b99c', // O el Client ID asignado para producción
    tenantId: 'dbab308c-779c-43d0-a679-5ff97d363793',
    
    // En producción NO se usa localhost, se usa el dominio HTTPS de la app
    redirectUri: 'https://midominio.com',
    postLogoutRedirectUri: 'https://midominio.com',

    authority: 'https://login.microsoftonline.com/dbab308c-779c-43d0-a679-5ff97d363793',

    scopes: [
      'openid',
      'profile',
      'email',
      'api://pedidos360-api/access_as_user'
    ],
    apiScope: 'api://pedidos360-api/access_as_user'
  },

  protectedResources: {
    apiGateway: {
      endpoint: 'https://api.pedidos360.com/api/*',
      scopes: ['api://pedidos360-api/access_as_user']
    }
  },

  // Deshabilitado en producción por seguridad
  enableMockFallback: false,

  apiEndpoints: {
    orders: '/api/orders',
    catalog: '/api/catalog',
    audit: '/api/audit',
    report: '/api/report'
  }
};