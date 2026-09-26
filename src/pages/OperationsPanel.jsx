import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import {
  Truck, Archive, AlertCircle, RefreshCw, MapPin, Calendar,
  X, Loader2, CheckCircle2, Clock, Upload, FileText, AlertTriangle,
} from 'lucide-react';

const STATUS_LABEL = {
  PLANNED:     { label: 'Planlandı', cls: 'badge-blue' },
  IN_PROGRESS: { label: 'Operasyonda', cls: 'badge-blue' },
  AT_PICKUP:   { label: 'Yükleme noktasında', cls: 'badge-yellow' },
  LOADING:     { label: 'Yüklemede', cls: 'badge-yellow' },
  IN_TRANSIT:  { label: 'Yolda', cls: 'badge-blue' },
  DELIVERING:  { label: 'Teslimatta', cls: 'badge-yellow' },
  ARRIVED:     { label: 'Teslim noktasında', cls: 'badge-yellow' },
  COMPLETED:   { label: 'Tamamlandı', cls: 'badge-green' },
  CANCELLED:   { label: 'İptal', cls: 'badge-red' },
};

const EVENT_BUTTONS = [
  { type: 'ARRIVED_PICKUP', label: 'Yükleme noktasına vardım', icon: MapPin },
  { type: 'LOADING_STARTED', label: 'Yükleme başladı', icon: Truck },
  { type: 'LOADING_COMPLETED', label: 'Yükleme tamamlandı', icon: CheckCircle2 },
  { type: 'DEPARTED', label: 'Yola çıktım', icon: Truck },
  { type: 'ARRIVED_DELIVERY', label: 'Teslim noktasına vardım', icon: MapPin },
  { type: 'DELIVERY_COMPLETED', label: 'Teslim tamamlandı', icon: CheckCircle2 },
];

const EVENT_LABEL = {
  ARRIVED_PICKUP: 'Yükleme noktasına varış',
  LOADING_STARTED: 'Yükleme başladı',
  LOADING_COMPLETED: 'Yükleme tamamlandı',
  DEPARTED: 'Sefer başladı',
  ARRIVED_DELIVERY: 'Teslim noktasına varış',
  DELIVERY_COMPLETED: 'Teslim tamamlandı',
  DELAY: 'Gecikme bildirimi',
  EXCEPTION: 'İstisna bildirimi',
  NOTE: 'Operasyon notu',
};

export default function OperationsPanel() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archive, setArchive] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionError, setActionError] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/operations', { params: { archive: archive ? '1' : '0' } });
      setTrips(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, [archive]);

  useEffect(() => { load(); }, [load]);

  async function refreshSelectedTrip() {
    const res = await api.get('/operations', { params: { archive: archive ? '1' : '0' } });
    const refreshed = (res.data.data || []).find(item => item.id === selectedTrip?.id);
    setSelectedTrip(refreshed || null);
  }

  async function addEvent(type, note = null) {
    if (!selectedTrip) return;
    setEventSubmitting(true); setActionError('');
    try {
      await api.post(`/operations/${selectedTrip.id}/events`, { eventType: type, note });
      await load();
      await refreshSelectedTrip();
    } catch (e) {
      setActionError(e.response?.data?.message || e.message);
    } finally { setEventSubmitting(false); }
  }

  async function uploadDocument(file, documentType) {
    if (!selectedTrip || !file) return;
    setDocumentUploading(true); setActionError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      await api.post(`/operations/${selectedTrip.id}/documents`, formData);
      await load();
      await refreshSelectedTrip();
    } catch (e) {
      setActionError(e.response?.data?.message || e.message);
    } finally { setDocumentUploading(false); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operasyon Paneli</h1>
          <p className="text-gray-500 text-sm">Onaylanmış seferleriniz ve operasyon bildirimleri.</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Yenile</button>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setArchive(false)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!archive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
          <Truck className="w-4 h-4" /> Aktif Seferler
        </button>
        <button onClick={() => setArchive(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${archive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
          <Archive className="w-4 h-4" /> Arşiv
        </button>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-2/3" /></div>)}</div>
      ) : trips.length === 0 ? (
        <div className="card p-12 text-center"><Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{archive ? 'Arşivde sefer bulunamadı.' : 'Aktif sefer bulunamadı.'}</p></div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const s = STATUS_LABEL[trip.status] || { label: trip.status, cls: 'badge-gray' };
            return (
              <button key={trip.id} type="button" onClick={() => { setSelectedTrip(trip); setActionError(''); }} className="card p-5 w-full text-left hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className="font-mono text-sm font-bold text-gray-900">{trip.tripNo}</span><span className={s.cls}>{s.label}</span></div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /><span className="truncate">{trip.baslangic}</span><span className="text-gray-300">→</span><span className="truncate">{trip.varis}</span></div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      {trip.aracPlaka && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{trip.aracPlaka}</span>}
                      {trip.soforAdi && <span>{trip.soforAdi}</span>}
                      {trip.planlananTarih && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(trip.planlananTarih).toLocaleDateString('tr-TR')}</span>}
                      {trip.eta && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />ETA {new Date(trip.eta).toLocaleString('tr-TR')}</span>}
                      {trip.delayMinutes > 0 && <span className="text-red-600">{trip.delayMinutes} dk gecikme</span>}
                      {trip.events?.length > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.events.length} olay</span>}
                      {trip.documents?.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{trip.documents.length} belge</span>}
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 shrink-0">Detay</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedTrip && <OperationDetailModal trip={selectedTrip} error={actionError} eventSubmitting={eventSubmitting} documentUploading={documentUploading} onClose={() => setSelectedTrip(null)} onEvent={addEvent} onUpload={uploadDocument} />}
    </div>
  );
}

function OperationDetailModal({ trip, error, eventSubmitting, documentUploading, onClose, onEvent, onUpload }) {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('POD');
  const status = STATUS_LABEL[trip.status] || { label: trip.status, cls: 'badge-gray' };

  function submitNote(eventType) {
    if (!note.trim()) return;
    onEvent(eventType, note.trim()); setNote('');
  }

  function submitDocument(e) {
    e.preventDefault();
    if (!file) return;
    onUpload(file, documentType); setFile(null); e.target.reset();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div><h2 className="font-semibold text-gray-900">Sefer Operasyon Detayı</h2><p className="text-xs text-gray-500 mt-0.5">{trip.tripNo} · {trip.baslangic} → {trip.varis}</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-700" title="Kapat"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-5">
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="flex items-center gap-2"><span className={status.cls}>{status.label}</span>{trip.aracPlaka && <span className="text-sm text-gray-600">{trip.aracPlaka}</span>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="border border-gray-100 rounded-lg px-3 py-2"><p className="text-xs text-gray-400">Sonraki aksiyon</p><p className="text-gray-700 mt-0.5">{trip.nextAction || 'Belirtilmemiş'}</p></div>
            <div className="border border-gray-100 rounded-lg px-3 py-2"><p className="text-xs text-gray-400">Tahmini varış</p><p className="text-gray-700 mt-0.5">{trip.eta ? new Date(trip.eta).toLocaleString('tr-TR') : 'Belirtilmemiş'}</p></div>
          </div>
          {trip.delayMinutes > 0 && <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 text-sm"><AlertTriangle className="w-4 h-4" />Planlanan varışa göre {trip.delayMinutes} dakika gecikme görünüyor.</div>}
          {trip.lastLocation && <div className="text-xs text-gray-500">Son konum: {trip.lastLocation.lat}, {trip.lastLocation.lng} · {trip.lastLocation.recordedAt ? new Date(trip.lastLocation.recordedAt).toLocaleString('tr-TR') : ''}</div>}

          {!['COMPLETED', 'CANCELLED'].includes(trip.status) && <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Operasyon bildirimi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{EVENT_BUTTONS.map(({ type, label, icon: Icon }) => <button key={type} type="button" onClick={() => onEvent(type)} disabled={eventSubmitting} className="btn-secondary justify-start text-left">{eventSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}{label}</button>)}</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"><textarea rows={2} className="input resize-none sm:col-span-2" value={note} onChange={e => setNote(e.target.value)} placeholder="Gecikme, istisna veya operasyon notu" /><button type="button" onClick={() => submitNote('DELAY')} disabled={eventSubmitting || !note.trim()} className="btn-secondary justify-center"><AlertTriangle className="w-4 h-4" /> Gecikme Bildir</button><button type="button" onClick={() => submitNote('EXCEPTION')} disabled={eventSubmitting || !note.trim()} className="btn-secondary justify-center"><AlertCircle className="w-4 h-4" /> İstisna Bildir</button></div>
          </section>}

          <section><h3 className="text-sm font-semibold text-gray-800 mb-2">Olay geçmişi</h3>{trip.events?.length ? <div className="space-y-2">{trip.events.map(event => <div key={event.id} className="border-l-2 border-blue-200 pl-3 py-1"><p className="text-sm font-medium text-gray-700">{EVENT_LABEL[event.type] || event.type}</p>{event.note && <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{event.note}</p>}<p className="text-xs text-gray-400 mt-1">{event.occurredAt ? new Date(event.occurredAt).toLocaleString('tr-TR') : ''}</p></div>)}</div> : <p className="text-sm text-gray-500">Henüz operasyon olayı bildirilmemiş.</p>}</section>

          <section><h3 className="text-sm font-semibold text-gray-800 mb-2">POD ve sefer belgeleri</h3><form onSubmit={submitDocument} className="flex flex-col sm:flex-row gap-2 mb-3"><select className="input sm:w-44" value={documentType} onChange={e => setDocumentType(e.target.value)}><option value="POD">POD / Teslim belgesi</option><option value="CMR">CMR</option><option value="DELIVERY_PHOTO">Teslim fotoğrafı</option><option value="OTHER">Diğer</option></select><input className="input flex-1" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} /><button type="submit" className="btn-primary justify-center" disabled={!file || documentUploading}>{documentUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Yükle</button></form>{trip.documents?.length ? <div className="space-y-2">{trip.documents.map(document => <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><span className="truncate text-gray-700">{document.name}</span><span className="text-xs text-gray-500">{document.status}</span></a>)}</div> : <p className="text-sm text-gray-500">Henüz belge yüklenmemiş.</p>}</section>
        </div>
        <div className="px-6 py-4 border-t border-gray-100"><button type="button" onClick={onClose} className="btn-secondary w-full justify-center">Kapat</button></div>
      </div>
    </div>
  );
}
