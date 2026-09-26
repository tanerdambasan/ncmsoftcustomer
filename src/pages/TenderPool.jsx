import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import {
  Package, Search, MapPin, Weight, Clock, X,
  AlertCircle, Filter, Send, Eye, Loader2, Paperclip, ExternalLink, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Countdown ─────────────────────────────────────────────────────────
function Countdown({ deadline }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    if (!deadline) { setLeft('—'); return; }
    function tick() {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setLeft('Süresi Doldu'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${h > 0 ? `${h}s ` : ''}${m}d ${s}sn`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const urgent = left !== '—' && left !== 'Süresi Doldu' &&
    (new Date(deadline) - Date.now()) < 3600000;

  if (left === 'Süresi Doldu') return <span className="badge-red">Süresi Doldu</span>;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
      <Clock className="w-3 h-3" /> {left}
    </span>
  );
}

// ── Bid Modal ─────────────────────────────────────────────────────────
function BidModal({ tender, onClose, onSuccess }) {
  const defaultStart = tender.teslimTarihi
    ? new Date(tender.teslimTarihi).toISOString().split('T')[0]
    : '';

  const [form, setForm] = useState({
    amount: '', currency: 'TRY', note: '', validityMinutes: '60',
    startDate: defaultStart, endDate: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) { setError('Tutar geçersiz.'); return; }
    setLoading(true);
    try {
      await api.post(`/tenders/${tender.id}/bids`, {
        amount: Number(form.amount),
        currency: form.currency,
        note: form.note || undefined,
        validityMinutes: Number(form.validityMinutes),
        startDate: form.startDate || undefined,
        endDate:   form.endDate   || undefined,
      });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Teklif Ver</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {/* Tender summary */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <p className="font-medium text-blue-900 text-sm">{tender.baslik}</p>
          <p className="text-blue-700 text-xs mt-1">
            {tender.baslangicNoktasi} → {tender.varisNoktasi}
          </p>
          {tender.agirlikKg && (
            <p className="text-blue-600 text-xs mt-0.5 flex items-center gap-1">
              <Weight className="w-3 h-3" /> {tender.agirlikKg.toLocaleString('tr-TR')} kg
            </p>
          )}
          {tender.ozelNotlar && (
            <p className="text-amber-700 text-xs mt-1 bg-amber-50 px-2 py-1 rounded">
              ⚠ {tender.ozelNotlar}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Teklif Tutarı *</label>
              <input type="number" min="1" step="0.01" className="input"
                placeholder="25000" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Para Birimi</label>
              <select className="input" value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Taşıma tarihleri */}
          <div>
            <label className="label flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Taşıma Tarihleri
              <span className="text-gray-400 text-xs font-normal">(opsiyonel — farklı öneri verebilirsiniz)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Taşıma Başlangıcı</label>
                <input type="date" className="input" value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Taşıma Bitişi</label>
                <input type="date" className="input" value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Teklif Geçerlilik Süresi (Dakika)</label>
            <input type="number" min="10" max="1440" className="input"
              value={form.validityMinutes}
              onChange={e => setForm(p => ({ ...p, validityMinutes: e.target.value }))} />
          </div>

          <div>
            <label className="label">Not (Opsiyonel)</label>
            <textarea rows={2} className="input resize-none"
              placeholder="Özel koşullar, teslimat garantisi vb."
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              <Send className="w-4 h-4" /> {loading ? 'Gönderiliyor…' : 'Teklif Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
const TYPES = [
  { value: '', label: 'Tüm Tipler' },
  { value: 'kompleYuk', label: 'Komple Yük' },
  { value: 'parsiyel',  label: 'Parsiyel' },
  { value: 'konteyner', label: 'Konteyner' },
  { value: 'diger',     label: 'Diğer' },
];

export default function TenderPool() {
  const [tenders, setTenders]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [yukTuru, setYukTuru]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [currency, setCurrency] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [selected, setSelected] = useState(null); // for bid modal
  const [detailTender, setDetailTender] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [toast, setToast]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search)  params.search  = search;
      if (yukTuru) params.yukTuru = yukTuru;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = `${dateTo}T23:59:59`;
      if (currency) params.currency = currency;
      if (vehicleType) params.vehicleType = vehicleType;
      params.page = page;
      params.pageSize = 20;
      const res = await api.get('/tenders', { params });
      const result = res.data.data || {};
      setTenders(result.items || []);
      setPagination(result.pagination || { page, pageSize: 20, total: result.items?.length || 0, totalPages: 1 });
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [search, yukTuru, dateFrom, dateTo, currency, vehicleType, page]);

  useEffect(() => { load(); }, [load]);

  function handleBidSuccess() {
    setSelected(null);
    setToast('Teklifiniz başarıyla iletildi!');
    setTimeout(() => setToast(''), 3000);
    load();
  }

  function updateFilter(setter) {
    return value => { setter(value); setPage(1); };
  }

  async function exportTenders(format = 'csv') {
    const params = {};
    if (search) params.search = search;
    if (yukTuru) params.yukTuru = yukTuru;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = `${dateTo}T23:59:59`;
    if (currency) params.currency = currency;
    if (vehicleType) params.vehicleType = vehicleType;
    const response = await api.get('/tenders/export', { params: { ...params, format }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ihale-havuzu.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function openDetail(tender) {
    setDetailTender(tender);
    setDetailData(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/tenders/${tender.id}`);
      setDetailData(res.data.data || null);
    } catch (e) {
      setDetailError(e.response?.data?.message || e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = tenders; // server-side search

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">İhale Havuzu</h1>
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">Teklif verebileceğiniz açık ihaleler.</p>
          <button onClick={() => exportTenders('csv')} className="btn-secondary shrink-0" title="Gerçek kayıtları CSV olarak indir">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => exportTenders('pdf')} className="btn-secondary shrink-0" title="Gerçek kayıtları PDF olarak indir">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="İhale ara (başlık, rota)…"
            value={search} onChange={e => updateFilter(setSearch)(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select className="input pl-9 pr-8 w-full sm:w-auto" value={yukTuru}
            onChange={e => updateFilter(setYukTuru)(e.target.value)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <input type="text" className="input" placeholder="Araç tipi" value={vehicleType}
          onChange={e => updateFilter(setVehicleType)(e.target.value)} />
        <select className="input" value={currency} onChange={e => updateFilter(setCurrency)(e.target.value)}>
          <option value="">Para birimi</option>
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <input type="date" className="input" value={dateFrom} onChange={e => updateFilter(setDateFrom)(e.target.value)} title="Başlangıç tarihi" />
        <input type="date" className="input" value={dateTo} onChange={e => updateFilter(setDateTo)(e.target.value)} title="Bitiş tarihi" />
      </div>

      {/* Content */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Uygun ihale bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TenderCard
              key={t.id}
              tender={t}
              onBid={() => setSelected(t)}
              onDetails={() => openDetail(t)}
            />
          ))}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
          <span>{pagination.total} kayıt · Sayfa {pagination.page} / {pagination.totalPages}</span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-2" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} title="Önceki sayfa">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="btn-secondary px-2" disabled={page >= pagination.totalPages} onClick={() => setPage(value => Math.min(pagination.totalPages, value + 1))} title="Sonraki sayfa">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <BidModal
          tender={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleBidSuccess}
        />
      )}

      {detailTender && (
        <TenderDetailModal
          tender={detailData || detailTender}
          loading={detailLoading}
          error={detailError}
          onClose={() => setDetailTender(null)}
          onBid={() => {
            setSelected(detailData || detailTender);
            setDetailTender(null);
          }}
        />
      )}
    </div>
  );
}

function TenderCard({ tender, onBid, onDetails }) {
  const expired = tender.deadline && new Date(tender.deadline) < new Date();
  const alreadyBid = !!tender.myBid;

  return (
    <div className={`card flex flex-col ${expired ? 'opacity-60' : ''}`}>
      <div className="p-5 flex-1">
        {/* Type badge */}
        <div className="flex items-start justify-between mb-3">
          <span className="badge-blue">{tender.yukTuru}</span>
          {tender.tehlikeliMadde && <span className="badge-red">⚠ Tehlikeli</span>}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-tight">{tender.baslik}</h3>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate">{tender.baslangicNoktasi}</span>
            <span className="text-gray-300 shrink-0">→</span>
            <span className="truncate">{tender.varisNoktasi}</span>
          </div>
          {tender.agirlikKg && (
            <div className="flex items-center gap-1.5">
              <Weight className="w-3 h-3 shrink-0" />
              {tender.agirlikKg.toLocaleString('tr-TR')} kg
              {tender.hacimM3 && <> / {tender.hacimM3} m³</>}
            </div>
          )}
          {tender.aracTipi && <p>Araç: {tender.aracTipi}</p>}
          {tender.ozelNotlar && (
            <p className="text-amber-600 bg-amber-50 px-2 py-1 rounded">⚠ {tender.ozelNotlar}</p>
          )}
        </div>

        {/* Countdown */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-400">{tender.teklifSayisi} teklif</span>
          {tender.deadline && <Countdown deadline={tender.deadline} />}
        </div>
      </div>

      {/* Action */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={onDetails}
          className="btn-secondary flex-1 justify-center"
          title="İhale detayını aç"
        >
          <Eye className="w-3.5 h-3.5" /> Detay
        </button>
        {alreadyBid ? (
          <div className="flex-1 text-center py-2 text-xs text-green-700 bg-green-50 rounded-lg font-medium">
            ✓ Teklifiniz iletildi — {Number(tender.myBid.tutar).toLocaleString('tr-TR')} {tender.myBid.paraBirimi}
          </div>
        ) : (
          <button
            onClick={onBid}
            disabled={expired}
            className="btn-primary flex-1 justify-center"
          >
            <Send className="w-3.5 h-3.5" /> Teklif Ver
          </button>
        )}
      </div>
    </div>
  );
}

function TenderDetailModal({ tender, loading, error, onClose, onBid }) {
  const alreadyBid = !!tender.myBid;
  const expired = tender.deadline && new Date(tender.deadline) < new Date();
  const [questions, setQuestions] = useState(tender.questions || []);
  const [questionText, setQuestionText] = useState('');
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState('');

  useEffect(() => {
    setQuestions(tender.questions || []);
  }, [tender.id, tender.questions]);

  async function submitQuestion(e) {
    e.preventDefault();
    const value = questionText.trim();
    if (value.length < 5) {
      setQuestionError('Sorunuz en az 5 karakter olmalıdır.');
      return;
    }
    setQuestionSubmitting(true);
    setQuestionError('');
    try {
      const response = await api.post(`/tenders/${tender.id}/questions`, { question: value });
      setQuestions(current => [...current, response.data.data]);
      setQuestionText('');
    } catch (e) {
      setQuestionError(e.response?.data?.message || e.message);
    } finally {
      setQuestionSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">İhale Detayı</h2>
            <p className="text-xs text-gray-500 mt-0.5">{tender.baslik}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" title="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Detay yükleniyor...
            </div>
          )}
          {error && !loading && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <DetailItem label="Yük türü" value={tender.yukTuru} />
                <DetailItem label="Araç tipi" value={tender.aracTipi || 'Belirtilmemiş'} />
                <DetailItem label="Başlangıç" value={tender.baslangicNoktasi} />
                <DetailItem label="Varış" value={tender.varisNoktasi} />
                <DetailItem label="Ağırlık" value={tender.agirlikKg ? `${tender.agirlikKg.toLocaleString('tr-TR')} kg` : 'Belirtilmemiş'} />
                <DetailItem label="Hacim" value={tender.hacimM3 ? `${tender.hacimM3} m³` : 'Belirtilmemiş'} />
                <DetailItem label="Son teklif tarihi" value={tender.deadline ? new Date(tender.deadline).toLocaleString('tr-TR') : 'Belirtilmemiş'} />
                <DetailItem label="Teklif sayısı" value={String(tender.teklifSayisi || 0)} />
              </div>

              {tender.aciklama && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Açıklama</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{tender.aciklama}</p>
                </section>
              )}

              {tender.ozelNotlar && (
                <section className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">Özel notlar</h3>
                  <p className="text-sm text-amber-700 whitespace-pre-wrap">{tender.ozelNotlar}</p>
                </section>
              )}

              {tender.orders?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Bağlı sipariş ve yük kalemleri</h3>
                  <div className="space-y-3">
                    {tender.orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-gray-800">{order.orderNo || 'Sipariş'}</span>
                          <span className="text-xs text-gray-500">{order.status || 'Durum belirtilmemiş'}</span>
                        </div>
                        {(order.etd || order.eta || order.transportMode) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {order.transportMode || 'Taşıma modu belirtilmemiş'}
                            {order.etd ? ` · ETD ${new Date(order.etd).toLocaleString('tr-TR')}` : ''}
                            {order.eta ? ` · ETA ${new Date(order.eta).toLocaleString('tr-TR')}` : ''}
                          </p>
                        )}
                        {order.items?.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {order.items.map(item => (
                              <div key={item.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                                <span className="font-medium">{item.description || `Kalem ${item.itemNo || ''}`}</span>
                                <span className="ml-2">
                                  {item.quantity ? `${item.quantity} ${item.packageType || ''}` : ''}
                                  {item.grossWeightKg ? ` · ${item.grossWeightKg} kg` : item.weightKg ? ` · ${item.weightKg} kg` : ''}
                                  {item.volumeCbm ? ` · ${item.volumeCbm} m³` : ''}
                                  {item.containerNo ? ` · ${item.containerNo}` : ''}
                                </span>
                                {item.hazardousMaterial && <span className="ml-2 text-red-600">ADR</span>}
                                {item.temperatureControlled && <span className="ml-2 text-blue-600">Isı kontrollü</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" /> Ek belgeler
                </h3>
                {tender.attachments?.length ? (
                  <div className="space-y-2">
                    {tender.attachments.map(file => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="truncate text-gray-700">{file.title || file.fileName || 'Belge'}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Bu ihale için ek belge bulunmuyor.</p>
                )}
              </section>

              {tender.questionsAvailable && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Soru-cevap</h3>
                  <div className="space-y-2">
                    {questions.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                        <p className="text-gray-700 whitespace-pre-wrap">{item.question}</p>
                        {item.answer ? (
                          <p className="mt-2 pl-3 border-l-2 border-blue-200 text-gray-600 whitespace-pre-wrap">{item.answer}</p>
                        ) : (
                          <p className="mt-2 text-xs text-amber-600">Yanıt bekliyor</p>
                        )}
                      </div>
                    ))}
                    {!questions.length && <p className="text-sm text-gray-500">Henüz soru sorulmamış.</p>}
                  </div>
                  <form onSubmit={submitQuestion} className="mt-3 space-y-2">
                    {questionError && <p className="text-xs text-red-600">{questionError}</p>}
                    <textarea
                      rows={2}
                      className="input resize-none"
                      value={questionText}
                      onChange={e => setQuestionText(e.target.value)}
                      placeholder="Operasyon ekibine soru sorun..."
                      disabled={questionSubmitting}
                    />
                    <button type="submit" className="btn-secondary" disabled={questionSubmitting || !questionText.trim()}>
                      {questionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Soru Gönder
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Kapat</button>
          <button type="button" onClick={onBid} disabled={loading || expired || alreadyBid} className="btn-primary flex-1 justify-center">
            <Send className="w-3.5 h-3.5" />
            {alreadyBid ? 'Teklif Verildi' : expired ? 'Süresi Doldu' : 'Teklif Ver'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="border border-gray-100 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5 break-words">{value || 'Belirtilmemiş'}</p>
    </div>
  );
}

