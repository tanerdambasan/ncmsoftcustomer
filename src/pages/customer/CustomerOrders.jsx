import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import customerApi from '../../api/customerClient';
import { Package, Plus, ArrowRight, X, AlertCircle, ClipboardList, RefreshCw } from 'lucide-react';
import { ORDER_STATUS_LABELS, orderStatusColor, orderStatusLabel } from '../../utils/customerStatus';

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'open', label: ORDER_STATUS_LABELS.open },
  { value: 'planned', label: ORDER_STATUS_LABELS.planned },
  { value: 'loading', label: ORDER_STATUS_LABELS.loading },
  { value: 'new', label: 'Yeni' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'in_transit', label: 'Yolda' },
  { value: 'at_customs', label: 'Gümrükte' },
  { value: 'arrived', label: ORDER_STATUS_LABELS.arrived },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'ready_to_invoice', label: ORDER_STATUS_LABELS.ready_to_invoice },
  { value: 'invoiced', label: ORDER_STATUS_LABELS.invoiced },
  { value: 'closed', label: 'Kapatıldı' },
  { value: 'cancelled', label: 'İptal' },
];

const inquiryStatusLabels = {
  new: 'Talep Alındı',
  open: 'İnceleme Bekliyor',
  under_review: 'İnceleniyor',
  quoted: 'Teklif Hazır',
  approval_pending: 'Onayınız Bekleniyor',
  approved: 'Onaylandı',
  accepted: 'Onaylandı',
  converted_to_order: 'Siparişe Dönüştü',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
  cancelled: 'İptal Edildi',
};

const inquiryStatusColors = {
  new: 'bg-blue-100 text-blue-700',
  open: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-green-100 text-green-700',
  approval_pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-purple-100 text-purple-700',
  accepted: 'bg-purple-100 text-purple-700',
  converted_to_order: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
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
    originAddressId: '', destAddressId: '', originAddress: '', destAddress: '',
    cargoDescription: '', cargoWeight: '',
    cargoUnit: 'kg', packageCount: 1, packageType: 'PALLET', volumeCbm: '',
    isHazmat: false, hazmatClass: '', unNumber: '',
    requestedPickupDate: '', requestedDeliveryDate: '',
    incoterm: 'DAP', specialNotes: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    customerApi.get('/addresses')
      .then(response => setAddresses(response.data.data.addresses || []))
      .catch(err => setError(err.response?.data?.message || 'Müşteri adresleri yüklenemedi.'))
      .finally(() => setAddressLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await customerApi.post('/orders', form);
      onCreated(response.data.data);
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
          <h2 className="text-lg font-bold text-gray-900">Yeni Taşıma Talebi</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {addresses.length > 0 ? <select required value={form.originAddressId}
              onChange={e => setForm(p=>({...p, originAddressId: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Kayıtlı yükleme adresi seçin</option>
              {addresses.map(address => <option key={address.id} value={address.id}>{address.title || address.line1} · {[address.city, address.district].filter(Boolean).join(', ')}</option>)}
            </select> : <textarea rows={2} required placeholder="Şehir, ilçe veya tam adres..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.originAddress} onChange={e => setForm(p=>({...p,originAddress:e.target.value}))} />}
            {addressLoading && <p className="text-xs text-gray-400 mt-1">Kayıtlı adresler yükleniyor...</p>}
            {!addressLoading && addresses.length === 0 && <p className="text-xs text-amber-600 mt-1">Kayıtlı adres bulunamadı. Manuel adres bilgisi giriniz.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teslim Adresi *</label>
            {addresses.length > 0 ? <select required value={form.destAddressId}
              onChange={e => setForm(p=>({...p, destAddressId: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Kayıtlı teslim adresi seçin</option>
              {addresses.map(address => <option key={address.id} value={address.id}>{address.title || address.line1} · {[address.city, address.district].filter(Boolean).join(', ')}</option>)}
            </select> : <textarea rows={2} required placeholder="Şehir, ilçe veya tam adres..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.destAddress} onChange={e => setForm(p=>({...p,destAddress:e.target.value}))} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Açıklaması *</label>
            <input type="text" required placeholder="Yük cinsi, miktarı, özellikleri..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.cargoDescription} onChange={e => setForm(p=>({...p,cargoDescription:e.target.value}))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık</label>
              <input type="number" placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.cargoWeight} onChange={e => setForm(p=>({...p,cargoWeight:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık Birimi</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.cargoUnit} onChange={e => setForm(p=>({...p,cargoUnit:e.target.value}))}>
                <option value="kg">Kilogram</option><option value="ton">Ton</option><option value="pallet">Palet</option><option value="package">Koli</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paket/Palet Adedi</label>
              <input type="number" min="1" required placeholder="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.packageCount} onChange={e => setForm(p=>({...p,packageCount:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paket Tipi</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.packageType} onChange={e => setForm(p=>({...p,packageType:e.target.value}))}>
                <option value="PALLET">Palet</option><option value="BOX">Koli</option><option value="SACK">Çuval</option><option value="CONTAINER">Konteyner</option><option value="OTHER">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hacim (m³)</label>
              <input type="number" min="0" step="0.001" placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.volumeCbm} onChange={e => setForm(p=>({...p,volumeCbm:e.target.value}))} />
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

          <div className="border border-gray-200 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.isHazmat} onChange={e => setForm(p=>({...p,isHazmat:e.target.checked}))} /> Tehlikeli yük
            </label>
            {form.isHazmat && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="ADR / tehlike sınıfı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.hazmatClass} onChange={e => setForm(p=>({...p,hazmatClass:e.target.value}))} />
              <input required placeholder="UN numarası" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.unNumber} onChange={e => setForm(p=>({...p,unNumber:e.target.value}))} />
            </div>}
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
              {saving ? 'Gönderiliyor...' : 'Taşıma Talebini Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerOrders() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(location.pathname.endsWith('/new'));
  const [activeView, setActiveView] = useState('orders');
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const load = (p = 1, s = status) => {
    setLoading(true);
    setError('');
    const params = { page: p, limit: 15 };
    if (s) params.status = s;
    customerApi.get('/orders', { params })
      .then(r => {
        setOrders(r.data.data.orders);
        setTotal(r.data.data.total);
        setPage(p);
        if (r.data.data.counts) setCounts(r.data.data.counts);
      })
      .catch(err => setError(err.response?.data?.message || 'Siparişler yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, status); }, [status]);

  useEffect(() => {
    if (location.pathname.endsWith('/new')) setShowModal(true);
  }, [location.pathname]);

  const loadInquiries = () => {
    setInquiriesLoading(true);
    setInquiriesError('');
    customerApi.get('/inquiries')
      .then(r => setInquiries(r.data.data.inquiries || []))
      .catch(err => setInquiriesError(err.response?.data?.message || 'Taşıma talepleri yüklenemedi.'))
      .finally(() => setInquiriesLoading(false));
  };

  useEffect(() => {
    if (activeView === 'inquiries') loadInquiries();
  }, [activeView]);

  const closeModal = () => {
    setShowModal(false);
    if (location.pathname.endsWith('/new')) navigate('/c/orders', { replace: true });
  };

  const handleCreated = (createdInquiry) => {
    closeModal();
    setActiveView('inquiries');
    setSuccessMsg(`Taşıma talebiniz alındı${createdInquiry?.inquiryNo ? ` (${createdInquiry.inquiryNo})` : ''}. Operasyon ekibimiz inceleyip teklif sürecini başlatacak.`);
    loadInquiries();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Siparişlerim</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerçekleşmiş ve devam eden operasyon siparişleriniz</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Yeni Taşıma Talebi
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        Taşıma talebi gönderdiğinizde önce operasyon ekibimiz inceleme yapar. Teklif onaylandıktan sonra gerçek operasyon siparişi oluşturulur.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => load(page, status)} className="ml-auto underline font-medium">Tekrar dene</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{successMsg}</div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveView('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${activeView === 'orders' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>
          <Package className="w-4 h-4" /> Operasyon Siparişleri
        </button>
        <button onClick={() => setActiveView('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${activeView === 'inquiries' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>
          <ClipboardList className="w-4 h-4" /> Taşıma Taleplerim
        </button>
      </div>

      {activeView === 'orders' && <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(opt => {
          const cnt = counts[opt.value];
          return (
            <button key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {opt.label}
              {cnt !== undefined && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${status === opt.value ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{cnt}</span>}
            </button>
          );
        })}
      </div>}

      {/* Table */}
      {activeView === 'orders' ? <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Package className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Sipariş bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
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
                const sc = orderStatusColor(o.status);
                const sl = orderStatusLabel(o.status);
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
          </div>
        )}
      </div> : (
        <div className="space-y-3">
          {inquiriesError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {inquiriesError}<button onClick={loadInquiries} className="ml-auto underline font-medium">Tekrar dene</button></div>}
          {inquiriesLoading ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm"><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Yükleniyor...</div> : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white rounded-xl border border-gray-100"><ClipboardList className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm">Henüz taşıma talebi bulunmuyor.</p></div>
          ) : inquiries.map(inquiry => {
            const statusKey = String(inquiry.status || '').toLowerCase();
            return <div key={inquiry.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inquiryStatusColors[statusKey] || 'bg-gray-100 text-gray-600'}`}>{inquiryStatusLabels[statusKey] || inquiry.status || 'Bilinmiyor'}</span><span className="text-xs text-gray-400">{inquiry.inquiry_no}</span></div>
                  <p className="text-sm font-medium text-gray-800">{inquiry.transport_mode} · {inquiry.service_type}</p>
                  <p className="text-xs text-gray-500 mt-1 whitespace-pre-line line-clamp-2">{inquiry.description || 'Açıklama girilmemiş.'}</p>
                  <p className="text-xs text-gray-400 mt-2">Oluşturulma: {new Date(inquiry.created_at).toLocaleString('tr-TR')}{inquiry.offerCount > 0 && <span className="ml-2 text-green-600 font-medium">{inquiry.offerCount} teklif mevcut</span>}</p>
                </div>
              </div>
            </div>;
          })}
        </div>
      )}

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

      {showModal && <NewOrderModal onClose={closeModal} onCreated={handleCreated} />}
    </div>
  );
}

