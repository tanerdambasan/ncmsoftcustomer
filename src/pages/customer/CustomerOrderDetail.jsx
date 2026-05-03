import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import customerApi from '../../api/customerClient';
import { ArrowLeft, MapPin, Truck, User, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  at_customs: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  new: 'Yeni', confirmed: 'Onaylandı', in_transit: 'Yolda',
  at_customs: 'Gümrükte', delivered: 'Teslim Edildi', cancelled: 'İptal',
};

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.get(`/orders/${id}`)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-gray-400">Sipariş bulunamadı.</div>
  );

  const { order, statusHistory = [], tracking = [], finance = [], notes = [] } = data;
  const sc = statusColors[order.status] || 'bg-gray-100 text-gray-600';
  const sl = statusLabels[order.status] || order.status;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/c/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.order_no}</h1>
          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1.5 rounded-full font-semibold ${sc}`}>{sl}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Sipariş Bilgileri</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Servis Tipi</p>
                <p className="font-medium text-gray-800">{order.service_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Taşıma Modu</p>
                <p className="font-medium text-gray-800">{order.transport_mode || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">İncoterm</p>
                <p className="font-medium text-gray-800">{order.incoterm || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">İstenen Teslimat</p>
                <p className="font-medium text-gray-800">
                  {order.requested_delivery_date ? new Date(order.requested_delivery_date).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fiili Teslimat</p>
                <p className="font-medium text-gray-800">
                  {order.actual_delivery_date ? new Date(order.actual_delivery_date).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Toplam Tutar</p>
                <p className="font-bold text-blue-700 text-base">
                  {order.total_sale_price ? `${Number(order.total_sale_price).toLocaleString('tr-TR')} ${order.currency}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Driver info */}
          {(order.driver_name || order.vehicle_plate) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Araç & Sürücü</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {order.driver_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{order.driver_name}</span>
                  </div>
                )}
                {order.driver_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${order.driver_phone}`} className="text-blue-600">{order.driver_phone}</a>
                  </div>
                )}
                {order.vehicle_plate && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{order.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking */}
          {tracking.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Kargo Takip</h2>
              <div className="space-y-3">
                {tracking.map(t => (
                  <div key={t.id} className="flex gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">{t.current_location || t.status}</p>
                      {t.note && <p className="text-gray-500 text-xs">{t.note}</p>}
                      <p className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finance */}
          {finance.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Faturalar</h2>
              <div className="space-y-2">
                {finance.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{f.description || 'Fatura'}</p>
                      {f.invoice_no && <p className="text-xs text-gray-400">#{f.invoice_no}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{Number(f.total_amount).toLocaleString('tr-TR')} {f.currency}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.billing_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {f.billing_status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Durum Geçmişi</h2>
            {statusHistory.length === 0 ? (
              <p className="text-xs text-gray-400">Henüz durum güncellemesi yok.</p>
            ) : (
              <ol className="relative border-l-2 border-gray-200 space-y-4 ml-2">
                {statusHistory.map((s, i) => (
                  <li key={i} className="ml-4">
                    <div className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                    <p className="text-sm font-medium text-gray-800">{statusLabels[s.status] || s.status}</p>
                    {s.note && <p className="text-xs text-gray-500">{s.note}</p>}
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString('tr-TR')}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Notlar</h2>
              <div className="space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{n.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

