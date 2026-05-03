import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Package, FileText, Truck, TrendingUp, Clock,
  CheckCircle, AlertCircle, ChevronRight, RefreshCw,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'blue', to }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-700',
  };
  const card = (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

const BID_STATUS = {
  beklemede:     { label: 'Beklemede',     cls: 'badge-yellow' },
  kazandi:       { label: 'Kazandı',       cls: 'badge-green'  },
  kaybetti:      { label: 'Kaybetti',      cls: 'badge-red'    },
  secildi:       { label: 'Seçildi',       cls: 'badge-blue'   },
  onaylandi:     { label: 'Onaylandı',     cls: 'badge-green'  },
  suresi_doldu:  { label: 'Süre Doldu',    cls: 'badge-gray'   },
};

export default function Dashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor…</div>;
  if (error)   return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    </div>
  );

  const { stats = {}, recentBids = [] } = data || {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Hoş geldiniz — güncel durumunuza göz atın.</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package}      label="Aktif İhaleler"       value={stats.activeTenders}   color="blue"   to="/tenders" />
        <StatCard icon={Clock}        label="Bekleyen Tekliflerim" value={stats.pendingBids}      color="yellow" to="/bids" />
        <StatCard icon={AlertCircle}  label="Onay Bekleyen"        value={stats.awaitingConfirm}  color="purple" to="/bids" />
        <StatCard icon={CheckCircle}  label="Kazandığım İşler"     value={stats.wonJobs}          color="green"  to="/operations" />
      </div>

      {/* Recent Bids */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Son Tekliflerim
          </h2>
          <Link to="/bids" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
            Tümünü gör <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentBids.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz teklif vermediniz.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBids.map(bid => {
              const s = BID_STATUS[bid.durum] || { label: bid.durum, cls: 'badge-gray' };
              return (
                <div key={bid.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{bid.ilanBaslik || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {bid.baslangic || ''}{bid.varis ? ` → ${bid.varis}` : ''}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(bid.tutar).toLocaleString('tr-TR')} {bid.paraBirimi}
                    </span>
                    <span className={s.cls}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

