import React, { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { TrendingUp, Plus, X, ChevronDown } from 'lucide-react';

const TRANSPORT_MODES = ['FTL','LTL','FCL','LCL','Air','Rail'];
const SERVICE_TYPES   = [
  { value: 'road',  label: 'Karayolu' },
  { value: 'sea',   label: 'Denizyolu' },
  { value: 'air',   label: 'Havayolu' },
  { value: 'rail',  label: 'Demiryolu' },
];

function QuotationForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    serviceType: 'road', transportMode: 'FTL',
    originAddress: '', destAddress: '',
    isInternational: false, shipmentDirection: 'export',
    requestedPickupDate: '',
    cargoDescription: '',
    items: [{ description: '', weight: '', unit: 'kg', quantity: 1 }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', weight: '', unit: 'kg', quantity: 1 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await customerApi.post('/quotation/request', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Fiyat Teklifi Talebi</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servis Tipi</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.serviceType} onChange={e => setForm(p=>({...p,serviceType:e.target.value}))}>
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taşıma Modu</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.transportMode} onChange={e => setForm(p=>({...p,transportMode:e.target.value}))}>
                {TRANSPORT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="intl" className="w-4 h-4"
              checked={form.isInternational}
              onChange={e => setForm(p=>({...p,isInternational:e.target.checked}))} />
            <label htmlFor="intl" className="text-sm text-gray-700">Uluslararası Taşıma</label>
            {form.isInternational && (
              <select className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={form.shipmentDirection} onChange={e => setForm(p=>({...p,shipmentDirection:e.target.value}))}>
                <option value="export">İhracat</option>
                <option value="import">İthalat</option>
                <option value="transit">Transit</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yükleme Noktası *</label>
            <input type="text" required placeholder="Şehir / Liman / Havalimanı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.originAddress} onChange={e => setForm(p=>({...p,originAddress:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Varış Noktası *</label>
            <input type="text" required placeholder="Şehir / Liman / Havalimanı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.destAddress} onChange={e => setForm(p=>({...p,destAddress:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İstenen Yükleme Tarihi</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.requestedPickupDate} onChange={e => setForm(p=>({...p,requestedPickupDate:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Açıklaması</label>
            <input type="text" placeholder="Ürün cinsi, özellikler, tehlike sınıfı..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.cargoDescription} onChange={e => setForm(p=>({...p,cargoDescription:e.target.value}))} />
          </div>

          {/* Cargo items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Kargo Kalemleri</label>
              <button type="button" onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Kalem Ekle
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <input type="text" placeholder="Ürün açıklaması" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs"
                    value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input type="number" placeholder="Ağırlık" className="w-20 border border-gray-300 rounded px-2 py-1.5 text-xs"
                    value={item.weight} onChange={e => updateItem(i, 'weight', e.target.value)} />
                  <select className="border border-gray-300 rounded px-2 py-1.5 text-xs"
                    value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    <option>kg</option><option>ton</option><option>palet</option><option>koli</option>
                  </select>
                  <input type="number" placeholder="Adet" className="w-16 border border-gray-300 rounded px-2 py-1.5 text-xs"
                    value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Gönderiliyor...' : 'Teklif Talebi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerQuotation() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    setLoading(true);
    customerApi.get('/quotation/list')
      .then(r => setInquiries(r.data.data.inquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreated = () => {
    setShowForm(false);
    setSuccessMsg('Fiyat teklifi talebiniz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.');
    load();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const statusColors = {
    new:      'bg-blue-100 text-blue-700',
    quoted:   'bg-green-100 text-green-700',
    accepted: 'bg-purple-100 text-purple-700',
    rejected: 'bg-red-100 text-red-700',
    expired:  'bg-gray-100 text-gray-600',
  };
  const statusLabels = { new: 'Yeni', quoted: 'Teklifli', accepted: 'Kabul Edildi', rejected: 'Reddedildi', expired: 'Süresi Doldu' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fiyat Teklifi Al</h1>
          <p className="text-sm text-gray-500 mt-0.5">Taşıma talepleriniz ve alınan teklifler</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Teklif İste
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{successMsg}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yükleniyor...</div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white rounded-xl border border-gray-100">
          <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Henüz teklif talebi yok</p>
          <p className="text-xs mt-1">Yeni teklif talebi oluşturmak için butona tıklayın</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map(inq => {
            const sc = statusColors[inq.status] || 'bg-gray-100 text-gray-600';
            const sl = statusLabels[inq.status] || inq.status;
            return (
              <div key={inq.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc}`}>{sl}</span>
                      <span className="text-xs text-gray-400">{inq.inquiry_no}</span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{inq.transport_mode} · {inq.service_type}</p>
                    {inq.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{inq.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(inq.created_at).toLocaleDateString('tr-TR')}
                      {inq.offerCount > 0 && <span className="ml-2 text-green-600 font-medium">{inq.offerCount} teklif mevcut</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <QuotationForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}
    </div>
  );
}

