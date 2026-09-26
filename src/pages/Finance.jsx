import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { Wallet, TrendingUp, Briefcase, Clock, AlertCircle, RefreshCw, FileText, Receipt, Upload } from 'lucide-react';

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
  PENDING:   { label: 'Beklemede', cls: 'badge-yellow' },
  PARTIAL:   { label: 'Kısmi Ödendi', cls: 'badge-yellow' },
  INVOICED:  { label: 'Faturalandı', cls: 'badge-blue' },
  PAID:      { label: 'Ödendi', cls: 'badge-green' },
  CANCELLED: { label: 'İptal', cls: 'badge-red' },
};

const SETTLEMENT_STATUS = {
  EXPECTED:  { label: 'Beklenen hakediş', cls: 'badge-gray' },
  ACCRUED:   { label: 'Hakediş oluştu', cls: 'badge-blue' },
  INVOICED:  { label: 'Fatura alındı', cls: 'badge-yellow' },
  PAID:      { label: 'Ödendi', cls: 'badge-green' },
  CANCELLED: { label: 'İptal', cls: 'badge-red' },
};

export default function Finance() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disputeFor, setDisputeFor] = useState(null);
  const [disputeText, setDisputeText] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);

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

  async function submitDispute(event) {
    event.preventDefault();
    if (!disputeFor || disputeText.trim().length < 5) return;
    setDisputeSubmitting(true);
    try {
      await api.post(`/finance/settlements/${disputeFor}/disputes`, { description: disputeText.trim() });
      setDisputeFor(null);
      setDisputeText('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDisputeSubmitting(false);
    }
  }

  async function uploadInvoice(settlementId, file) {
    if (!file) return;
    setInvoiceUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/finance/settlements/${settlementId}/invoice`, formData);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setInvoiceUploading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor…</div>;
  if (error)   return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" />{error}</div>
    </div>
  );

  const { summary = {}, monthlyEarnings = [], invoices = [], settlements = [] } = data || {};

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
            <p className="text-sm text-gray-500">Onaylı taşıma bedeli</p>
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

      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Hakediş ve ödeme süreci</h2>
          </div>
          <span className="text-xs text-gray-500">{summary.settlementCount || 0} gerçek finans kaydı</span>
        </div>
        {settlements.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Tedarikçinize bağlı hakediş kaydı bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Sefer / Sipariş</th>
                  <th className="text-left px-4 py-3 font-medium">Aşama</th>
                  <th className="text-right px-4 py-3 font-medium">Hakediş</th>
                  <th className="text-right px-4 py-3 font-medium">Ödenen</th>
                  <th className="text-right px-6 py-3 font-medium">Kalan</th>
                  <th className="text-left px-4 py-3 font-medium">Ödeme</th>
                  <th className="text-left px-4 py-3 font-medium">Mutabakat</th>
                  <th className="text-left px-4 py-3 font-medium">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map(item => {
                  const status = SETTLEMENT_STATUS[item.stage] || SETTLEMENT_STATUS.EXPECTED;
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{item.tripNo || item.orderNo || 'Finans kaydı'}</p>
                        <p className="text-xs text-gray-500">{item.description || item.category}</p>
                      </td>
                      <td className="px-4 py-3"><span className={status.cls}>{status.label}</span></td>
                      <td className="px-4 py-3 text-right">{item.amount.toLocaleString('tr-TR')} {item.currency}</td>
                      <td className="px-4 py-3 text-right text-green-700">{item.paidAmount.toLocaleString('tr-TR')} {item.currency}</td>
                      <td className="px-6 py-3 text-right font-medium">{item.remainingAmount.toLocaleString('tr-TR')} {item.currency}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <div>Vade: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : '—'}</div>
                        <div>Plan: {item.plannedPaymentDate ? new Date(item.plannedPaymentDate).toLocaleDateString('tr-TR') : 'Planlanmadı'}</div>
                        <div>Gerçek: {item.actualPaymentDate ? new Date(item.actualPaymentDate).toLocaleDateString('tr-TR') : '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={item.reconciliationStatus === 'MATCHED' || item.reconciliationStatus === 'CLOSED' ? 'badge-green' : item.reconciliationStatus === 'DISPUTED' ? 'badge-red' : 'badge-gray'}>
                          {item.reconciliationStatus === 'MATCHED' ? 'Eşleşti' : item.reconciliationStatus === 'CLOSED' ? 'Kapandı' : item.reconciliationStatus === 'DISPUTED' ? 'İtirazlı' : 'Açık'}
                        </span>
                        {item.financeNote && <p className="text-xs text-gray-500 mt-1">{item.financeNote}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => setDisputeFor(item.id)}>
                          {item.disputeCount ? `${item.disputeCount} itiraz` : 'İtiraz bildir'}
                        </button>
                        <label className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-blue-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Fatura yükle
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={invoiceUploading} onChange={event => uploadInvoice(item.id, event.target.files?.[0])} />
                        </label>
                        {item.invoiceDocuments?.map(document => (
                          <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-600 truncate" title={document.name}>
                            {document.name}
                          </a>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {disputeFor && (
          <form onSubmit={submitDispute} className="border-t border-gray-100 px-6 py-4 bg-amber-50/60 flex flex-col sm:flex-row gap-2">
            <input className="input flex-1" placeholder="Uyuşmayan tutar veya belgeyi açıklayın" value={disputeText} onChange={event => setDisputeText(event.target.value)} />
            <button type="button" className="btn-secondary" onClick={() => { setDisputeFor(null); setDisputeText(''); }}>Vazgeç</button>
            <button type="submit" className="btn-primary" disabled={disputeSubmitting || disputeText.trim().length < 5}>{disputeSubmitting ? 'Gönderiliyor…' : 'İtirazı gönder'}</button>
          </form>
        )}
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
              const s = INV_STATUS[String(inv.durum || '').toUpperCase()] || { label: inv.durum || 'Bilinmiyor', cls: 'badge-gray' };
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
                      {Number(inv.tutar).toLocaleString('tr-TR')} {inv.currency || 'TRY'}
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

