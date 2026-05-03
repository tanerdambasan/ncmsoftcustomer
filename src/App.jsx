import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';

// Supplier pages
import Layout       from './components/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import TenderPool   from './pages/TenderPool';
import MyBids       from './pages/MyBids';
import OperationsPanel from './pages/OperationsPanel';
import Finance      from './pages/Finance';
import ConfirmPage  from './pages/ConfirmPage';

// Customer pages
import CustomerLayout    from './components/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders    from './pages/customer/CustomerOrders';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail';
import CustomerCRM       from './pages/customer/CustomerCRM';
import CustomerFinance   from './pages/customer/CustomerFinance';
import CustomerQuotation from './pages/customer/CustomerQuotation';
import CustomerTracking  from './pages/customer/CustomerTrackingLive';

// ── Route Guards ──────────────────────────────────────────────────────────

function PrivateSupplierRoute({ children }) {
  const { user, loading, isSupplier } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSupplier && user) return <Navigate to="/c" replace />;
  return <Layout>{children}</Layout>;
}

function PrivateCustomerRoute({ children }) {
  const { user, loading, isCustomer } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCustomer && user) return <Navigate to="/" replace />;
  return <CustomerLayout>{children}</CustomerLayout>;
}

function PublicRoute({ children }) {
  const { user, loading, isCustomer } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isCustomer ? '/c' : '/'} replace />;
  return children;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/confirm/:token" element={<ConfirmPage />} />

      {/* Supplier Portal */}
      <Route path="/"           element={<PrivateSupplierRoute><Dashboard /></PrivateSupplierRoute>} />
      <Route path="/tenders"    element={<PrivateSupplierRoute><TenderPool /></PrivateSupplierRoute>} />
      <Route path="/bids"       element={<PrivateSupplierRoute><MyBids /></PrivateSupplierRoute>} />
      <Route path="/operations" element={<PrivateSupplierRoute><OperationsPanel /></PrivateSupplierRoute>} />
      <Route path="/finance"    element={<PrivateSupplierRoute><Finance /></PrivateSupplierRoute>} />

      {/* Customer Portal */}
      <Route path="/c"              element={<PrivateCustomerRoute><CustomerDashboard /></PrivateCustomerRoute>} />
      <Route path="/c/orders"       element={<PrivateCustomerRoute><CustomerOrders /></PrivateCustomerRoute>} />
      <Route path="/c/orders/new"   element={<PrivateCustomerRoute><CustomerOrders /></PrivateCustomerRoute>} />
      <Route path="/c/orders/:id"   element={<PrivateCustomerRoute><CustomerOrderDetail /></PrivateCustomerRoute>} />
      <Route path="/c/tracking"     element={<PrivateCustomerRoute><CustomerTracking /></PrivateCustomerRoute>} />
      <Route path="/c/crm"          element={<PrivateCustomerRoute><CustomerCRM /></PrivateCustomerRoute>} />
      <Route path="/c/finance"      element={<PrivateCustomerRoute><CustomerFinance /></PrivateCustomerRoute>} />
      <Route path="/c/quotation"    element={<PrivateCustomerRoute><CustomerQuotation /></PrivateCustomerRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
