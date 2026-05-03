import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import customerApi from '../../api/customerClient';
import {
  Package, Truck, MessageSquare, Receipt,
  ArrowRight, Clock, CheckCircle, AlertCircle, TrendingUp,
} from 'lucide-react';

const statusLabels = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Onaylandı', color: 'bg-purple-100 text-purple-700' },
  in_transit: { label: 'Yolda', color: 'bg-yellow-100 text-yellow-700' },
  at_customs: { label: 'Gümrükte', color: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Teslim', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4 border border-gray-100">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const { orderStats = {}, openTickets = 0, recentOrders = [], finance = {} } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">Hoş geldiniz! İşte hesabınızın özeti.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Aktif Sipariş" value={orderStats.active ?? 0}
          color="bg-blue-100 text-blue-600" />
        <StatCard icon={CheckCircle} label="Teslim Edildi" value={orderStats.delivered ?? 0}
          color="bg-green-100 text-green-600" />
        <StatCard icon={MessageSquare} label="Açık Biletler" value={openTickets}
          color="bg-orange-100 text-orange-600" />
        <StatCard icon={Receipt} label="Borç Bakiye"
          value={`${(finance.outstanding || 0).toLocaleString('tr-TR')} ${finance.currency || 'TRY'}`}
          color="bg-purple-100 text-purple-600"
          sub={`Toplam Fatura: ${(finance.totalInvoiced || 0).toLocaleString('tr-TR')}`} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/c/orders/new"
          className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors">
          <Package className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Yeni Sipariş</p>
            <p className="text-xs text-blue-200">Taşıma talebi oluştur</p>
          </div>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/c/quotation"
          className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-colors">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-800">Fiyat Al</p>
            <p className="text-xs text-gray-500">Anlık teklif talebi</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link to="/c/crm"
          className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-colors">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-800">Destek Talebi</p>
            <p className="text-xs text-gray-500">Şikayet, öneri, bilgi</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Son Siparişler</h2>
          <Link to="/c/orders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Tümü <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Henüz sipariş bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => {
              const s = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.order_no}</p>
                    <p className="text-xs text-gray-400">{order.service_type} · {new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.total_sale_price && (
                      <span className="text-sm font-semibold text-gray-700">
                        {Number(order.total_sale_price).toLocaleString('tr-TR')} {order.currency}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    <Link to={`/c/orders/${order.id}`} className="text-blue-500 hover:text-blue-700">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

