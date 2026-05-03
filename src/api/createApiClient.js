/**
 * createApiClient — Customer Portal ortak Axios factory
 * ═══════════════════════════════════════════════════════════════
 * client.js ve customerClient.js tekrarlanan interceptor mantığını
 * bu tek fabrika üzerinden yönetir.
 *
 * Özellikler:
 *  • JWT token otomatik ekleme (request interceptor)
 *  • x-tenant-id / x-company-id header desteği
 *  • 401 → token refresh → orijinal isteği tekrarla
 *  • Refresh başarısız → tüm anahtarlar temizlenir, /login'e yönlendirilir
 *  • Aynı anda gelen 401 istekleri için refresh kuyruğu (race condition önleme)
 */

import axios from 'axios';

const SP_KEYS = ['sp_access_token', 'sp_refresh_token', 'sp_tenant_id', 'sp_company_id', 'sp_user'];

function clearSession() {
    SP_KEYS.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
    }
}

/**
 * @param {object} opts
 * @param {string}  opts.baseURL         - Axios baseURL (örn. '/api/supplier')
 * @param {string}  opts.refreshEndpoint - Refresh POST URL (örn. '/api/supplier/auth/refresh')
 * @param {boolean} [opts.includeTenant=false] - x-tenant-id / x-company-id header eklensin mi?
 */
export function createApiClient({ baseURL, refreshEndpoint, includeTenant = false }) {
    let isRefreshing = false;
    let queue = [];

    const processQueue = (err, token = null) => {
        queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
        queue = [];
    };

    const client = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
    });

    // ── REQUEST: token + tenant header ──────────────────────────────────
    client.interceptors.request.use((config) => {
        const token = localStorage.getItem('sp_access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        if (includeTenant) {
            const tenantId  = localStorage.getItem('sp_tenant_id');
            const companyId = localStorage.getItem('sp_company_id');
            if (tenantId)  config.headers['x-tenant-id']  = tenantId;
            if (companyId) config.headers['x-company-id'] = companyId;
        }

        return config;
    });

    // ── RESPONSE: 401 → refresh → retry ────────────────────────────────
    client.interceptors.response.use(
        (res) => res,
        async (err) => {
            const original = err.config;

            if (err.response?.status !== 401 || original._retry) {
                return Promise.reject(err);
            }

            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject });
                }).then((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return client(original);
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('sp_refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(refreshEndpoint, { refreshToken });
                const newToken = data.accessToken;

                localStorage.setItem('sp_access_token', newToken);
                if (data.refreshToken) localStorage.setItem('sp_refresh_token', data.refreshToken);

                processQueue(null, newToken);
                original.headers.Authorization = `Bearer ${newToken}`;
                return client(original);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                clearSession();
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
    );

    return client;
}

