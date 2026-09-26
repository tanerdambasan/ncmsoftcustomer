import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, RefreshCw, AlertCircle, ArrowRight, Wallet, Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const ICONS = { TENDER: Package, ACTION: Bell, FINANCE: Wallet, OPERATION: Truck };

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notifications');
      const data = response.data.data || {};
      setItems(data.items || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openNotification(item) {
    if (!item.isRead) {
      await api.patch(`/notifications/${item.id}/read`);
      setItems(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row));
      setUnreadCount(value => Math.max(0, value - 1));
    }
    if (item.actionPath) navigate(item.actionPath);
  }

  async function markAllRead() {
    await api.post('/notifications/read-all');
    setItems(current => current.map(row => ({ ...row, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bildirim ve Aksiyon Merkezi</h1>
          <p className="text-gray-500 text-sm">İhale, operasyon ve ödeme adımlarındaki gerçek durum değişiklikleri.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary"><CheckCheck className="w-4 h-4" /> Tümünü okundu işaretle</button>}
          <button onClick={load} className="btn-secondary" title="Yenile"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
      {loading ? (
        <div className="card p-8 text-gray-400">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Bekleyen aksiyon bulunmuyor.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {items.map(item => {
            const Icon = ICONS[item.type] || Bell;
            return (
              <button key={item.id} onClick={() => openNotification(item)} className={`w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 ${item.isRead ? '' : 'bg-blue-50/50'}`}>
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.isRead ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.title}</span>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </span>
                  <span className="block text-sm text-gray-600 mt-1">{item.body}</span>
                  <span className="block text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString('tr-TR')}</span>
                </span>
                {item.actionPath && <ArrowRight className="w-4 h-4 text-gray-400 mt-2 shrink-0" />}
                {item.isRead && <Check className="w-4 h-4 text-green-600 mt-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
