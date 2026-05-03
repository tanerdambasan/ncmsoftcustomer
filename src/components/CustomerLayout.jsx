import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard, Package, FileText, Receipt, MessageSquare,
  Menu, X, LogOut, ChevronRight, Truck, Building2,
} from 'lucide-react';

const navItems = [
  { to: '/c',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/c/orders',     icon: Package,         label: 'Siparişlerim' },
  { to: '/c/tracking',   icon: Truck,           label: 'Canlı Takip' },
  { to: '/c/quotation',  icon: FileText,        label: 'Fiyat Teklifi Al' },
  { to: '/c/crm',        icon: MessageSquare,   label: 'Destek & CRM' },
  { to: '/c/finance',    icon: Receipt,         label: 'Finans / Bakiye' },
];

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm block">MüşteriPortal</span>
            <span className="text-blue-300 text-xs">by NCMSoft</span>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 mx-3 mt-4 bg-blue-800/50 rounded-xl">
        <p className="text-white text-sm font-medium truncate">{user?.name || 'Müşteri'}</p>
        <p className="text-blue-300 text-xs truncate">{user?.email}</p>
        <span className="mt-1 inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">MÜŞTERİ</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/c'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-blue-200 hover:bg-blue-800/60 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-red-600/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-blue-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-60 h-full flex flex-col bg-blue-900 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 text-sm">Müşteri Portalı</span>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100">
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

