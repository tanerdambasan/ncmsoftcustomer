import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const SUPPLIER_ROLES = ['SUPPLIER', 'DRIVER'];
const CUSTOMER_ROLES = ['CUSTOMER'];

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sp_user');
    const token  = localStorage.getItem('sp_access_token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    // Önce tedarikçi portalını dene
    let data = null;
    let portalType = 'supplier';

    try {
      const resp = await axios.post('/api/supplier/auth/login', { email, password });
      data = resp.data;
      if (!data.success) throw new Error(data.message);
    } catch (supplierErr) {
      // 403 ya da başka bir hata → müşteri portalını dene
      try {
        const resp = await axios.post('/api/customer/auth/login', { email, password });
        data = resp.data;
        if (!data.success) throw new Error(data.message);
        portalType = 'customer';
      } catch (customerErr) {
        // İkisi de başarısız → asıl hatayı fırlat
        const msg = supplierErr?.response?.data?.message
          || customerErr?.response?.data?.message
          || 'Geçersiz email veya şifre.';
        throw new Error(msg);
      }
    }

    const userData = { ...data.user, portalType };
    localStorage.setItem('sp_access_token',  data.accessToken);
    localStorage.setItem('sp_refresh_token', data.refreshToken);
    localStorage.setItem('sp_user',          JSON.stringify(userData));
    localStorage.setItem('sp_portal_type',   portalType);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('sp_refresh_token');
      const portalType   = localStorage.getItem('sp_portal_type') || 'supplier';
      const endpoint     = portalType === 'customer'
        ? '/api/customer/auth/logout'
        : '/api/supplier/auth/logout';
      if (refreshToken) await axios.post(endpoint, { refreshToken });
    } catch { /* best-effort */ }
    localStorage.removeItem('sp_access_token');
    localStorage.removeItem('sp_refresh_token');
    localStorage.removeItem('sp_user');
    localStorage.removeItem('sp_portal_type');
    setUser(null);
  }, []);

  const isSupplier = user && SUPPLIER_ROLES.includes(user.role);
  const isCustomer = user && CUSTOMER_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSupplier, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
