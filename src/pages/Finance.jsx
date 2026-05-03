import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { Wallet, TrendingUp, Briefcase, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';

function MonthlyChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Henüz kazanç verisi yok.</div>
  );

  const max = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="flex items-end gap-2 h-40 px-2">
      {data.map(d => {
        const pct = Math.round((d.total / max) * 100);
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              {d.total > 0 ? `${(d.total / 1000).toFixed(0)}K` : ''}
            </span>
            <div
              className="w-full bg-blue-500 rounded-t transition-all"
              style={{ height: `${Math.max(pct, 4)}%` }}
              title={`${d.month}: ${d.total.toLocaleString('tr-TR')} TRY`}
            />
            <span className="text-xs text-gray-400">{d.month.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

const INV_STATUS = {
  pending: { label: 'Beklemede', cls: 'badge-yellow' },
  paid:    { label: 'Ödendi',    cls: 'badge-green'  },
  overdue: { label: 'Gecikmiş', cls: 'badge-red'    },
};

export default function Finance() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/finance');
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor…</div>;
  if (error)   return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" />{error}</div>
    </div>
  );

  const { summary = {}, monthlyEarnings = [], invoices = [] } = data || {};

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finans / Cari</h1>
          <p className="text-gray-500 text-sm">Kazanç özeti ve fatura durumu.</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Yenile</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalEarned?.toLocaleString('tr-TR') || 0} ₺
            </p>
            <p className="text-sm text-gray-500">Toplam Kazanç</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalJobs || 0}</p>
            <p className="text-sm text-gray-500">Tamamlanan İş</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{summary.pendingBids || 0}</p>
            <p className="text-sm text-gray-500">Bekleyen Teklif</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Aylık Kazanç Grafiği
        </h2>
        <MonthlyChart data={monthlyEarnings} />
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Faturalar</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz fatura bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => {
              const s = INV_STATUS[inv.durum] || { label: inv.durum, cls: 'badge-gray' };
              return (
                <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.no}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(inv.tarih).toLocaleDateString('tr-TR')}
                      {inv.aciklama ? ` — ${inv.aciklama}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {Number(inv.tutar).toLocaleString('tr-TR')} ₺
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

