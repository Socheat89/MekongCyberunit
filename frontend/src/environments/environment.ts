export const environment = {
  production: false,
  apiUrl: (typeof window !== 'undefined' && window.location.port === '4200')
    ? 'http://localhost:5230/api'
    : '/api',
  tokenKey: 'access_token',
  tenantKey: 'active_tenant_id'
};

