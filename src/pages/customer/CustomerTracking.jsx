import React, { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { MapPin, Truck, Phone, User, Search, RefreshCw } from 'lucide-react';

export default function CustomerTracking() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    customerApi.get('/orders', { params: { limit: 50, status: 'in_transit' } })
      .then(r => setOrders(r.data.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadTracking = async (orderId) => {
    setSelected(orderId);
    setTrackLoading(true);
    try {
      const r = await customerApi.get(`/orders/${orderId}/tracking`);
      setTrackData(r.data.data);
    } catch {}
    setTrackLoading(false);
  };

  const filtered = orders.filter(o =>
    !search || o.order_no.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_STEPS = [
    { key: 'new',        label: 'Oluşturuldu' },
    { key: 'confirmed',  label: 'Onaylandı' },
    { key: 'in_transit', label: 'Yolda' },
    { key: 'delivered',  label: 'Teslim' },
  ];

  const getStepIndex = (status) => STATUS_STEPS.findIndex(s => s.key === status);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Canlı Takip</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Sipariş no ara..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Yükleniyor...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aktif sefer bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(o => (
                <button key={o.id} onClick={() => loadTracking(o.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected === o.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}>
                  <p className="font-semibold text-sm text-gray-800">{o.order_no}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.service_type} · Yolda</p>
                  {o.driver_name && <p className="text-xs text-gray-400 mt-0.5">🧑 {o.driver_name}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tracking detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 text-gray-400">
              <MapPin className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Sol taraftan bir sipariş seçin</p>
            </div>
          ) : trackLoading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : trackData ? (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">{trackData.order.order_no}</h2>
                  <button onClick={() => loadTracking(selected)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Step tracker */}
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 z-0">
                    <div className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(getStepIndex(trackData.order.status) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                  </div>
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step.key} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                        i <= getStepIndex(trackData.order.status)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>{i + 1}</div>
                      <p className="text-xs text-gray-500 mt-1 text-center w-16">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver info */}
              {(trackData.order.driver_name || trackData.order.vehicle_plate) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Araç & Sürücü</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {trackData.order.driver_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{trackData.order.driver_name}</span>
                      </div>
                    )}
                    {trackData.order.driver_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${trackData.order.driver_phone}`} className="text-blue-600">{trackData.order.driver_phone}</a>
                      </div>
                    )}
                    {trackData.order.vehicle_plate && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-800">{trackData.order.vehicle_plate}</span>
                      </div>
                    )}
                    {trackData.order.eta && (
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-400">Tahmini Varış (ETA)</p>
                        <p className="font-semibold text-gray-800">{new Date(trackData.order.eta).toLocaleString('tr-TR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Events timeline */}
              {trackData.events.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Sevkiyat Olayları</h3>
                  <ol className="relative border-l-2 border-gray-200 space-y-4 ml-2">
                    {trackData.events.map((ev, i) => (
                      <li key={i} className="ml-5">
                        <div className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-800">{ev.status}</p>
                        {ev.note && <p className="text-xs text-gray-500">{ev.note}</p>}
                        <p className="text-xs text-gray-400">{new Date(ev.created_at).toLocaleString('tr-TR')}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Current GPS */}
              {trackData.currentPosition && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{trackData.currentPosition.current_location || 'Son Konum'}</p>
                      {trackData.currentPosition.note && <p className="text-xs text-gray-600 mt-0.5">{trackData.currentPosition.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">Güncellendi: {new Date(trackData.currentPosition.updated_at || trackData.currentPosition.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100 text-gray-400">
              <p className="text-sm">Takip bilgisi yüklenemedi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

