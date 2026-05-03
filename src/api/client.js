/**
 * Tedarikçi (Supplier) Portal API istemcisi
 * Temel URL: /api/supplier
 * x-tenant-id / x-company-id header'ları otomatik eklenir.
 */
import { createApiClient } from './createApiClient';

const api = createApiClient({
    baseURL: '/api/supplier',
    refreshEndpoint: '/api/supplier/auth/refresh',
    includeTenant: true,
});

export default api;

