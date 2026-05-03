import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import {
  Package, Search, MapPin, Weight, Clock, X,
  AlertCircle, Filter, ChevronDown, Send,
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
  const [form, setForm]     = useState({ amount: '', currency: 'TRY', note: '', validityMinutes: '60' });
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
      <div className="card w-full max-w-lg">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="label">Teklif Geçerlilik Süresi (Dakika)</label>
            <input type="number" min="10" max="1440" className="input"
              value={form.validityMinutes}
              onChange={e => setForm(p => ({ ...p, validityMinutes: e.target.value }))} />
          </div>

          <div>
            <label className="label">Not (Opsiyonel)</label>
            <textarea rows={3} className="input resize-none"
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
  const [selected, setSelected] = useState(null); // for bid modal
  const [toast, setToast]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search)  params.search  = search;
      if (yukTuru) params.yukTuru = yukTuru;
      const res = await api.get('/tenders', { params });
      setTenders(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [search, yukTuru]);

  useEffect(() => { load(); }, [load]);

  function handleBidSuccess() {
    setSelected(null);
    setToast('Teklifiniz başarıyla iletildi!');
    setTimeout(() => setToast(''), 3000);
    load();
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
        <p className="text-gray-500 text-sm">Teklif verebileceğiniz açık ihaleler.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="İhale ara (başlık, rota)…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select className="input pl-9 pr-8 w-full sm:w-auto" value={yukTuru}
            onChange={e => setYukTuru(e.target.value)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
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
            />
          ))}
        </div>
      )}

      {selected && (
        <BidModal
          tender={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleBidSuccess}
        />
      )}
    </div>
  );
}

function TenderCard({ tender, onBid }) {
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
      <div className="px-5 pb-5">
        {alreadyBid ? (
          <div className="w-full text-center py-2 text-xs text-green-700 bg-green-50 rounded-lg font-medium">
            ✓ Teklifiniz iletildi — {Number(tender.myBid.tutar).toLocaleString('tr-TR')} {tender.myBid.paraBirimi}
          </div>
        ) : (
          <button
            onClick={onBid}
            disabled={expired}
            className="btn-primary w-full justify-center"
          >
            <Send className="w-3.5 h-3.5" /> Teklif Ver
          </button>
        )}
      </div>
    </div>
  );
}

