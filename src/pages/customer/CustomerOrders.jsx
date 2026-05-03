import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customerApi from '../../api/customerClient';
import { Package, Plus, Search, Filter, ArrowRight, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'new', label: 'Yeni' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'in_transit', label: 'Yolda' },
  { value: 'at_customs', label: 'Gümrükte' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  at_customs: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const SERVICE_TYPES = [
  { value: 'road', label: 'Karayolu' },
  { value: 'sea', label: 'Denizyolu' },
  { value: 'air', label: 'Havayolu' },
  { value: 'rail', label: 'Demiryolu' },
];

const TRANSPORT_MODES = [
  { value: 'FTL', label: 'Komple (FTL)' },
  { value: 'LTL', label: 'Parsiyel (LTL)' },
  { value: 'FCL', label: 'Dolu Konteyner (FCL)' },
  { value: 'LCL', label: 'Parça Konteyner (LCL)' },
];

function NewOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    serviceType: 'road', transportMode: 'FTL',
    originAddress: '', destAddress: '',
    cargoDescription: '', cargoWeight: '',
    requestedPickupDate: '', requestedDeliveryDate: '',
    incoterm: 'DAP', specialNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await customerApi.post('/orders', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Yeni Sipariş Talebi</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servis Tipi</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.serviceType} onChange={e => setForm(p=>({...p,serviceType:e.target.value}))}>
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taşıma Modu</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.transportMode} onChange={e => setForm(p=>({...p,transportMode:e.target.value}))}>
                {TRANSPORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yükleme Adresi *</label>
            <textarea rows={2} required placeholder="Şehir, ilçe veya tam adres..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.originAddress} onChange={e => setForm(p=>({...p,originAddress:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teslim Adresi *</label>
            <textarea rows={2} required placeholder="Şehir, ilçe veya tam adres..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.destAddress} onChange={e => setForm(p=>({...p,destAddress:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Açıklaması *</label>
            <input type="text" required placeholder="Yük cinsi, miktarı, özellikleri..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.cargoDescription} onChange={e => setForm(p=>({...p,cargoDescription:e.target.value}))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık (kg)</label>
              <input type="number" placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.cargoWeight} onChange={e => setForm(p=>({...p,cargoWeight:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İncoterm</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.incoterm} onChange={e => setForm(p=>({...p,incoterm:e.target.value}))}>
                {['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(i=><option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yükleme Tarihi</label>
              <input type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.requestedPickupDate} onChange={e => setForm(p=>({...p,requestedPickupDate:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teslim Tarihi</label>
              <input type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.requestedDeliveryDate} onChange={e => setForm(p=>({...p,requestedDeliveryDate:e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Özel Notlar</label>
            <textarea rows={2} placeholder="Tehlikeli madde, soğuk zincir, açık araç vs..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.specialNotes} onChange={e => setForm(p=>({...p,specialNotes:e.target.value}))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Gönderiliyor...' : 'Sipariş Talebi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = (p = 1, s = status) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (s) params.status = s;
    customerApi.get('/orders', { params })
      .then(r => {
        setOrders(r.data.data.orders);
        setTotal(r.data.data.total);
        setPage(p);
        if (r.data.data.counts) setCounts(r.data.data.counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, status); }, [status]);

  const handleCreated = () => {
    setShowModal(false);
    setSuccessMsg('Sipariş talebiniz başarıyla iletildi. Ekibimiz en kısa sürede teklif sunacak.');
    load(1);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Siparişlerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {total} sipariş</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Yeni Sipariş
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{successMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(opt => {
          const cnt = counts[opt.value];
          return (
            <button key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {opt.label}
              {cnt !== undefined && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  status === opt.value
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Package className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Sipariş bulunamadı</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sipariş No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Servis</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tutar</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sürücü</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => {
                const sc = statusColors[o.status] || 'bg-gray-100 text-gray-600';
                const sl = STATUS_OPTIONS.find(s => s.value === o.status)?.label || o.status;
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.order_no}</td>
                    <td className="px-4 py-3 text-gray-600">{o.service_type}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {o.total_sale_price ? `${Number(o.total_sale_price).toLocaleString('tr-TR')} ${o.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc}`}>{sl}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.driver_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Link to={`/c/orders/${o.id}`} className="text-blue-500 hover:text-blue-700">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 15) }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2)
            .map(p => (
              <button key={p} onClick={() => load(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >{p}</button>
            ))}
        </div>
      )}

      {showModal && <NewOrderModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}

