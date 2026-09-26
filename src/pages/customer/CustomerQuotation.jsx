import React, { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { TrendingUp, Plus, X, ChevronDown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
    originAddressId: '', destAddressId: '', originAddress: '', destAddress: '',
    isInternational: false, shipmentDirection: 'export',
    requestedPickupDate: '', requestedDeliveryDate: '', incoterm: 'DAP',
    cargoDescription: '',
    items: [{ description: '', weight: '', unit: 'kg', quantity: 1 }],
    isHazmat: false, hazmatClass: '', unNumber: '',
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

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', weight: '', unit: 'kg', quantity: 1 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        items: form.items.map(item => ({
          ...item,
          isHazmat: form.isHazmat,
          hazmatClass: form.isHazmat ? form.hazmatClass : null,
          unNumber: form.isHazmat ? form.unNumber : null,
        })),
      };
      await customerApi.post('/quotation/request', payload);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {addresses.length > 0 ? <select required value={form.originAddressId}
              onChange={e => setForm(p=>({...p, originAddressId: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Kayıtlı yükleme adresi seçin</option>
              {addresses.map(address => <option key={address.id} value={address.id}>{address.title || address.line1} · {[address.city, address.district].filter(Boolean).join(', ')}</option>)}
            </select> : <input type="text" required placeholder="Şehir / Liman / Havalimanı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.originAddress} onChange={e => setForm(p=>({...p,originAddress:e.target.value}))} />}
            {addressLoading && <p className="text-xs text-gray-400 mt-1">Kayıtlı adresler yükleniyor...</p>}
            {!addressLoading && addresses.length === 0 && <p className="text-xs text-amber-600 mt-1">Kayıtlı adres bulunamadı. Manuel konum giriniz.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Varış Noktası *</label>
            {addresses.length > 0 ? <select required value={form.destAddressId}
              onChange={e => setForm(p=>({...p, destAddressId: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Kayıtlı teslim adresi seçin</option>
              {addresses.map(address => <option key={address.id} value={address.id}>{address.title || address.line1} · {[address.city, address.district].filter(Boolean).join(', ')}</option>)}
            </select> : <input type="text" required placeholder="Şehir / Liman / Havalimanı"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.destAddress} onChange={e => setForm(p=>({...p,destAddress:e.target.value}))} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İstenen Yükleme Tarihi</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.requestedPickupDate} onChange={e => setForm(p=>({...p,requestedPickupDate:e.target.value}))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">İstenen Teslim Tarihi</label><input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.requestedDeliveryDate} onChange={e => setForm(p=>({...p,requestedDeliveryDate:e.target.value}))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">İncoterm</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.incoterm} onChange={e => setForm(p=>({...p,incoterm:e.target.value}))}>{['EXW','FCA','FOB','CIF','CPT','CIP','DAP','DPU','DDP'].map(value => <option key={value}>{value}</option>)}</select></div>
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
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    customerApi.get('/quotation/list')
      .then(r => setInquiries(r.data.data.inquiries || []))
      .catch(err => setError(err.response?.data?.message || 'Teklif talepleri yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreated = () => {
    setShowForm(false);
    setSuccessMsg('Fiyat teklifi talebiniz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.');
    load();
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const openDetail = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setDetail(null);
    setActionError('');
    setDetailLoading(true);
    try {
      const response = await customerApi.get(`/quotation/${inquiry.id}`);
      setDetail(response.data.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Teklif detayı yüklenemedi.');
    } finally {
      setDetailLoading(false);
    }
  };

  const approveOffer = async (offer) => {
    if (!selectedInquiry || !offer?.offer_id || actionLoading) return;
    const confirmed = window.confirm('Bu teklifi onayladığınızda gerçek operasyon siparişi oluşturulacaktır. Devam etmek istiyor musunuz?');
    if (!confirmed) return;

    setActionLoading(true);
    setActionError('');
    try {
      const response = await customerApi.post(`/quotation/${selectedInquiry.id}/offers/${offer.offer_id}/approve`);
      const result = response.data.data;
      setSuccessMsg(`Teklif onaylandı. Operasyon siparişi: ${result.orderNo || result.orderId}`);
      setSelectedInquiry(null);
      setDetail(null);
      load();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Teklif onaylanamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColors = {
    new:      'bg-blue-100 text-blue-700',
    quoted:   'bg-green-100 text-green-700',
    converted_to_order: 'bg-green-100 text-green-700',
    approval_pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-purple-100 text-purple-700',
    accepted: 'bg-purple-100 text-purple-700',
    rejected: 'bg-red-100 text-red-700',
    expired:  'bg-gray-100 text-gray-600',
  };
  const statusLabels = { new: 'Talep Alındı', open: 'İnceleme Bekliyor', under_review: 'İnceleniyor', quoted: 'Teklif Hazır', approval_pending: 'Onayınız Bekleniyor', approved: 'Onaylandı', accepted: 'Kabul Edildi', converted_to_order: 'Siparişe Dönüştü', rejected: 'Reddedildi', expired: 'Süresi Doldu' };

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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={load} className="ml-auto underline font-medium">Tekrar dene</button>
        </div>
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
              <button type="button" key={inq.id} onClick={() => openDetail(inq)} className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-300 hover:shadow-md transition-all">
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
                <p className="text-xs text-blue-600 mt-3 font-medium">Detayı ve teklifleri görüntüle</p>
              </button>
            );
          })}
        </div>
      )}

      {showForm && <QuotationForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div><h2 className="text-lg font-bold text-gray-900">Talep ve Teklif Detayı</h2><p className="text-xs text-gray-500 mt-1">{selectedInquiry.inquiry_no}</p></div>
              <button onClick={() => { setSelectedInquiry(null); setDetail(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {actionError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{actionError}</div>}
              {detailLoading ? <div className="flex justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div> : detail && <>
                <div className="bg-gray-50 rounded-xl p-4 text-sm"><p className="font-medium text-gray-800">{detail.inquiry?.description || selectedInquiry.description || 'Talep açıklaması bulunmuyor.'}</p><p className="text-xs text-gray-500 mt-2">{detail.inquiry?.transport_mode} · {detail.inquiry?.service_type}</p></div>
                <div><h3 className="font-semibold text-gray-800 mb-3">Teklif Alternatifleri</h3>
                  {detail.offers?.length ? <div className="space-y-3">{detail.offers.map(offer => {
                    const status = String(offer.offer_status || '').toUpperCase();
                    const canApprove = !['APPROVED', 'REJECTED', 'EXPIRED'].includes(status) && String(detail.inquiry?.status || '').toLowerCase() !== 'converted_to_order';
                    return <div key={offer.offer_id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div><p className="font-medium text-gray-800">{offer.offer_title || offer.offer_code || 'Teklif alternatifi'}</p><p className="text-xs text-gray-500 mt-1">{offer.quotation_no} · Geçerlilik: {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</p></div>
                      <div className="text-right"><p className="font-bold text-gray-900">{offer.total_price != null ? `${Number(offer.total_price).toLocaleString('tr-TR')} ${offer.currency || ''}` : 'Tutar belirtilmemiş'}</p>{canApprove ? <button onClick={() => approveOffer(offer)} disabled={actionLoading} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"><CheckCircle className="w-3 h-3" /> Onayla ve Sipariş Oluştur</button> : <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500"><CheckCircle className="w-3 h-3" /> {status === 'APPROVED' ? 'Onaylandı' : status === 'REJECTED' ? 'Reddedildi' : status || 'Durum yok'}</span>}</div>
                    </div>;
                  })}</div> : <p className="text-sm text-gray-500">Bu talep için henüz teklif oluşturulmamış.</p>}
                </div>
              </>}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isHazmat} onChange={e => setForm(p=>({...p,isHazmat:e.target.checked}))} /> Tehlikeli yük</label>
            {form.isHazmat && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input required placeholder="ADR / tehlike sınıfı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.hazmatClass} onChange={e => setForm(p=>({...p,hazmatClass:e.target.value}))} /><input required placeholder="UN numarası" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.unNumber} onChange={e => setForm(p=>({...p,unNumber:e.target.value}))} /></div>}
          </div>
        </div>
      )}
    </div>
  );
}

