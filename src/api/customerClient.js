/**
 * Müşteri (Customer) Portal API istemcisi
 * Temel URL: /api/customer
 * Not: customerClient daha önce x-tenant-id / x-company-id header'larını
 * eksik gönderiyordu — createApiClient factory ile düzeltildi.
 */
import { createApiClient } from './createApiClient';

const customerApi = createApiClient({
    baseURL: '/api/customer',
    refreshEndpoint: '/api/customer/auth/refresh',
    includeTenant: true,
});

export default customerApi;
