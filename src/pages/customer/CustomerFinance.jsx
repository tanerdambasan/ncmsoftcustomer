import React, { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { Receipt, AlertCircle, CheckCircle, CreditCard, X } from 'lucide-react';

function PaymentModal({ invoices, onClose, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [method, setMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const totalSelected = invoices
    .filter(i => selected.includes(i.id) && i.billing_status !== 'paid')
    .reduce((s, i) => s + Number(i.total_amount), 0);

  const submit = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      await onSubmit({ invoiceIds: selected, paymentMethod: method, notes });
    } finally { setSaving(false); }
  };

  const unpaid = invoices.filter(i => i.billing_status !== 'paid');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Ödeme Talebi</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {unpaid.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Ödeme bekleyen fatura yok.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Ödeyeceğiniz faturaları seçin:</p>
              <div className="space-y-2">
                {unpaid.map(inv => (
                  <label key={inv.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected.includes(inv.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="checkbox" className="w-4 h-4"
                      checked={selected.includes(inv.id)}
                      onChange={() => toggle(inv.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{inv.description || 'Taşımacılık Hizmeti'}</p>
                      <p className="text-xs text-gray-500">{inv.order_no} {inv.invoice_no ? `· #${inv.invoice_no}` : ''}</p>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{Number(inv.total_amount).toLocaleString('tr-TR')} {inv.currency}</p>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="bank_transfer">Banka Havalesi / EFT</option>
                  <option value="credit_card">Kredi Kartı</option>
                  <option value="check">Çek</option>
                  <option value="cash">Nakit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (opsiyonel)</label>
                <textarea rows={2} placeholder="Ödeme bankası, IBAN, açıklama notu..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {selected.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Seçili tutar</p>
                  <p className="text-2xl font-bold text-blue-700">{totalSelected.toLocaleString('tr-TR')} TRY</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium">İptal</button>
          <button onClick={submit} disabled={saving || !selected.length}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40">
            {saving ? 'Gönderiliyor...' : 'Ödeme Talebi Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    setLoading(true);
    customerApi.get('/finance/summary')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePaymentSubmit = async (payload) => {
    await customerApi.post('/finance/payment-request', payload);
    setShowPayment(false);
    setSuccessMsg('Ödeme talebiniz alındı. Hesap ekibimiz en kısa sürede sizi arayacak.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const { totalInvoiced = 0, totalPaid = 0, outstanding = 0, currency = 'TRY', invoices = [] } = data || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finans / Bakiye</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fatura ve ödeme durumunuz</p>
        </div>
        {outstanding > 0 && (
          <button onClick={() => setShowPayment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <CreditCard className="w-4 h-4" /> Ödeme Yap
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{successMsg}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500 font-medium">Toplam Fatura</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalInvoiced.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{currency}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500 font-medium">Ödenen</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{currency}</p>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 ${outstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            {outstanding > 0 ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
            <p className="text-sm text-gray-500 font-medium">Bekleyen Borç</p>
          </div>
          <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {outstanding.toLocaleString('tr-TR')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{currency}</p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Fatura Listesi</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Receipt className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Fatura bulunamadı</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fatura No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sipariş</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Açıklama</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Tutar</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_no || '—'}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{inv.order_no}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{inv.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {Number(inv.total_amount).toLocaleString('tr-TR')} {inv.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      inv.billing_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {inv.billing_status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          invoices={invoices}
          onClose={() => setShowPayment(false)}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
}

