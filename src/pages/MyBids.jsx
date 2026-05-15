import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import {
  FileText, Filter, AlertCircle, RefreshCw,
  MapPin, Trash2, Pencil, X, CheckCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  beklemede:    { label: 'Beklemede',     cls: 'badge-yellow' },
  kazandi:      { label: 'Kazandı 🎉',    cls: 'badge-green'  },
  kaybetti:     { label: 'Kaybetti',      cls: 'badge-red'    },
  secildi:      { label: 'Seçildi ⏳',    cls: 'badge-blue'   },
  onaylandi:    { label: 'Onaylandı ✓',   cls: 'badge-green'  },
  suresi_doldu: { label: 'Süre Doldu',    cls: 'badge-gray'   },
};

const FILTERS = [
  { value: '',         label: 'Tümü' },
  { value: 'beklemede', label: 'Beklemede' },
  { value: 'kazandi',  label: 'Kazandı' },
  { value: 'kaybetti', label: 'Kaybetti' },
];

function EditModal({ bid, onClose, onSuccess }) {
  const [amount, setAmount]   = useState(String(bid.tutar));
  const [note, setNote]       = useState(bid.aciklama || '');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setError('Geçerli tutar girin.'); return; }
    setLoading(true); setError('');
    try {
      await api.patch(`/bids/${bid.id}`, { amount: Number(amount), note: note || undefined });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold">Teklifi Güncelle</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div>
            <label className="label">Yeni Tutar ({bid.paraBirimi})</label>
            <input type="number" min="1" className="input" value={amount}
              onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="label">Not</label>
            <textarea rows={3} className="input resize-none" value={note}
              onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyBids() {
  const [bids, setBids]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('');
  const [editing, setEditing]   = useState(null);
  const [toast, setToast]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/bids/mine', { params });
      setBids(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function withdraw(bid) {
    if (!window.confirm('Bu teklifi geri çekmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/bids/${bid.id}`);
      setToast('Teklif geri çekildi.');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tekliflerim</h1>
          <p className="text-gray-500 text-sm">Verdiğiniz tüm teklifler.</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Yenile</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : bids.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Bu filtrede teklif bulunamadı.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {bids.map(bid => {
            const s   = STATUS_CONFIG[bid.durum] || { label: bid.durum, cls: 'badge-gray' };
            const isPending = bid.durum === 'beklemede';
            const isSelected = bid.isSelected && !bid.isConfirmed;
            return (
              <div key={bid.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={s.cls}>{s.label}</span>
                      {isSelected && bid.expiryDate && (
                        <span className="text-xs text-amber-600 font-medium">
                          ⏰ Onay için: {new Date(bid.expiryDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{bid.ilanBaslik || '—'}</p>
                    {(bid.baslangic || bid.varis) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {bid.baslangic}{bid.varis && ` → ${bid.varis}`}
                      </p>
                    )}
                    {bid.aciklama && <p className="text-xs text-gray-400 mt-1 italic">{bid.aciklama}</p>}
                    {(bid.startDate || bid.endDate) && (
                      <p className="text-xs text-blue-600 mt-1">
                        📅 {bid.startDate ? new Date(bid.startDate).toLocaleDateString('tr-TR') : '—'}
                        {' → '}
                        {bid.endDate   ? new Date(bid.endDate).toLocaleDateString('tr-TR')   : '—'}
                      </p>
                    )}
                    {bid.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Red nedeni: {bid.rejectionReason}</p>
                    )}
                    {bid.driverName && (
                      <p className="text-xs text-green-700 mt-1">
                        Sürücü: {bid.driverName} — {bid.vehiclePlate}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {Number(bid.tutar).toLocaleString('tr-TR')} <span className="text-sm font-normal">{bid.paraBirimi}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(bid.olusturmaTarihi).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>

                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setEditing(bid)} className="btn-secondary text-xs py-1.5">
                      <Pencil className="w-3 h-3" /> Güncelle
                    </button>
                    <button onClick={() => withdraw(bid)} className="btn-danger text-xs py-1.5">
                      <Trash2 className="w-3 h-3" /> Geri Çek
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditModal
          bid={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); setToast('Teklif güncellendi.'); setTimeout(() => setToast(''), 3000); }}
        />
      )}
    </div>
  );
}

