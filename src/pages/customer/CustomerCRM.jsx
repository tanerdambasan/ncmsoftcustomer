import React, { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';
import { MessageSquare, Plus, X, ChevronDown, ChevronUp, Send } from 'lucide-react';

const TICKET_TYPES = [
  { value: 'complaint', label: '🚨 Şikayet', color: 'bg-red-100 text-red-700' },
  { value: 'request',   label: '📋 Talep',   color: 'bg-blue-100 text-blue-700' },
  { value: 'feedback',  label: '💡 Öneri',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'thanks',    label: '🙏 Teşekkür',color: 'bg-green-100 text-green-700' },
  { value: 'info',      label: 'ℹ️ Bilgi',    color: 'bg-gray-100 text-gray-700' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Düşük',  color: 'text-gray-500' },
  { value: 'normal', label: 'Normal', color: 'text-blue-500' },
  { value: 'high',   label: 'Yüksek', color: 'text-orange-500' },
  { value: 'urgent', label: 'Acil',   color: 'text-red-600 font-bold' },
];

const STATUS_LABELS = {
  open:        { label: 'Açık',          color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'İşlemde',       color: 'bg-yellow-100 text-yellow-700' },
  resolved:    { label: 'Çözüldü',       color: 'bg-green-100 text-green-700' },
  closed:      { label: 'Kapatıldı',     color: 'bg-gray-100 text-gray-600' },
};

function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ ticketType: 'request', subject: '', description: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await customerApi.post('/crm/tickets', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Yeni Destek Talebi</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bilet Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {TICKET_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(p=>({...p, ticketType: t.value}))}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all ${
                    form.ticketType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(f=>({...f, priority: p.value}))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.priority === p.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konu *</label>
            <input type="text" required placeholder="Bilet konusunu kısaca belirtiniz..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.subject} onChange={e => setForm(p=>({...p, subject: e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama *</label>
            <textarea rows={4} required placeholder="Sorununuzu veya talebinizi detaylıca açıklayınız..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.description} onChange={e => setForm(p=>({...p, description: e.target.value}))} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Gönderiliyor...' : 'Bilet Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketDetail({ ticketId, onClose }) {
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    customerApi.get(`/crm/tickets/${ticketId}`).then(r => setData(r.data.data)).catch(() => {});
  }, [ticketId]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await customerApi.post(`/crm/tickets/${ticketId}/reply`, { message: reply });
      setReply('');
      const r = await customerApi.get(`/crm/tickets/${ticketId}`);
      setData(r.data.data);
    } catch {}
    setSending(false);
  };

  if (!data) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl p-8 text-gray-400">Yükleniyor...</div>
    </div>
  );

  const { ticket, responses = [] } = data;
  const st = STATUS_LABELS[ticket.status] || { label: ticket.status, color: 'bg-gray-100 text-gray-600' };
  const tt = TICKET_TYPES.find(t => t.value === ticket.ticket_type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tt?.color || 'bg-gray-100 text-gray-600'}`}>{tt?.label || ticket.ticket_type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              <span className="text-xs text-gray-400">{ticket.ticket_no}</span>
            </div>
            <h2 className="font-bold text-gray-900">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Original message */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-800">{ticket.description}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(ticket.created_at).toLocaleString('tr-TR')}</p>
          </div>

          {/* Responses */}
          {responses.map(r => (
            <div key={r.id} className={`rounded-xl p-4 ${r.responder_name ? 'bg-gray-50 ml-6' : 'bg-blue-50'}`}>
              {r.responder_name && <p className="text-xs text-blue-600 font-semibold mb-1">{r.responder_name}</p>}
              <p className="text-sm text-gray-800">{r.message}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleString('tr-TR')}</p>
            </div>
          ))}
        </div>

        {/* Reply */}
        {ticket.status !== 'closed' && (
          <div className="px-6 py-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <textarea rows={2} placeholder="Yanıtınızı yazın..."
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={reply} onChange={e => setReply(e.target.value)} />
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerCRM() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter)   params.type   = typeFilter;
    customerApi.get('/crm/tickets', { params })
      .then(r => { setTickets(r.data.data.tickets); setTotal(r.data.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Destek & CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Şikayet, talep, öneri ve teşekkürleriniz</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Yeni Bilet
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[{ value: '', label: 'Tümü' }, ...Object.entries(STATUS_LABELS).map(([v, s]) => ({ value: v, label: s.label }))].map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${statusFilter === opt.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Yükleniyor...</div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white rounded-xl border border-gray-100">
          <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Henüz bilet oluşturulmamış</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => {
            const st = STATUS_LABELS[t.status] || { label: t.status, color: 'bg-gray-100 text-gray-600' };
            const tt = TICKET_TYPES.find(x => x.value === t.ticket_type);
            const pri = PRIORITIES.find(p => p.value === t.priority);
            return (
              <div key={t.id} onClick={() => setSelectedId(t.id)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tt?.color || 'bg-gray-100 text-gray-600'}`}>{tt?.label || t.ticket_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      <span className={`text-xs font-semibold ${pri?.color || ''}`}>{pri?.label}</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.ticket_no} · {new Date(t.created_at).toLocaleDateString('tr-TR')}
                      {t.response_count > 0 && ` · ${t.response_count} yanıt`}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <NewTicketModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />}
      {selectedId && <TicketDetail ticketId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

