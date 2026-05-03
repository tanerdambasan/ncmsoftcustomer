import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { Truck, Archive, AlertCircle, RefreshCw, MapPin, Calendar } from 'lucide-react';

const STATUS_LABEL = {
  PLANNED:    { label: 'Planlandı',   cls: 'badge-blue'   },
  LOADING:    { label: 'Yüklemede',  cls: 'badge-yellow' },
  IN_TRANSIT: { label: 'Yolda',      cls: 'badge-blue'   },
  DELIVERING: { label: 'Teslimatta', cls: 'badge-yellow' },
  COMPLETED:  { label: 'Tamamlandı', cls: 'badge-green'  },
  CANCELLED:  { label: 'İptal',      cls: 'badge-red'    },
};

export default function OperationsPanel() {
  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [archive, setArchive]   = useState(false);

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operasyon Paneli</h1>
          <p className="text-gray-500 text-sm">Onaylanmış seferleriniz.</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Yenile</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setArchive(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            !archive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
          }`}>
          <Truck className="w-4 h-4" /> Aktif Seferler
        </button>
        <button onClick={() => setArchive(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            archive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
          }`}>
          <Archive className="w-4 h-4" /> Arşiv
        </button>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{archive ? 'Arşivde sefer bulunamadı.' : 'Aktif sefer bulunamadı.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const s = STATUS_LABEL[trip.status] || { label: trip.status, cls: 'badge-gray' };
            return (
              <div key={trip.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-gray-900">{trip.tripNo}</span>
                      <span className={s.cls}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{trip.baslangic}</span>
                      <span className="text-gray-300">→</span>
                      <span className="truncate">{trip.varis}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      {trip.aracPlaka && <span>🚛 {trip.aracPlaka}</span>}
                      {trip.soforAdi  && <span>👤 {trip.soforAdi}</span>}
                      {trip.planlananTarih && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(trip.planlananTarih).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {trip.bitisTarih && (
                        <span className="flex items-center gap-1 text-green-600">
                          ✓ {new Date(trip.bitisTarih).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

