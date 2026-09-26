import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import customerApi from '../../api/customerClient';
import { ArrowLeft, MapPin, Truck, User, Phone, CheckCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { orderStatusColor, orderStatusLabel } from '../../utils/customerStatus';

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSaving, setClaimSaving] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimForm, setClaimForm] = useState({ claimType: 'damage', priority: 'high', quantity: '', unit: '', occurredAt: '', description: '' });

  useEffect(() => {
    customerApi.get(`/orders/${id}`)
      .then(r => setData(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Sipariş detayı yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="w-9 h-9 text-red-500" />
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">Tekrar dene</button>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-gray-400">Sipariş bulunamadı.</div>
  );

  const {
    order, statusHistory = [], milestones = [], exceptions = [], documents = [], claims = [],
    deliverySignatures = [], tracking = [], finance = [], notes = [], items = [],
  } = data;
  const sc = orderStatusColor(order.status);
  const sl = orderStatusLabel(order.status);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/c/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.order_no}</h1>
          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1.5 rounded-full font-semibold ${sc}`}>{sl}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Sipariş Bilgileri</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Servis Tipi</p>
                <p className="font-medium text-gray-800">{order.service_type || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Taşıma Modu</p>
                <p className="font-medium text-gray-800">{order.transport_mode || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">İncoterm</p>
                <p className="font-medium text-gray-800">{order.incoterm || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">İstenen Teslimat</p>
                <p className="font-medium text-gray-800">
                  {order.requested_delivery_date ? new Date(order.requested_delivery_date).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fiili Teslimat</p>
                <p className="font-medium text-gray-800">
                  {order.actual_delivery_date ? new Date(order.actual_delivery_date).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Toplam Tutar</p>
                <p className="font-bold text-blue-700 text-base">
                  {order.total_sale_price ? `${Number(order.total_sale_price).toLocaleString('tr-TR')} ${order.currency}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Cargo / Items */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Yük / Kalem Bilgileri</h2>
              <div className="space-y-3">
                {items.map((it, i) => {
                  const details = [
                    it.quantity != null && `${it.quantity}${it.unit_type ? ' ' + it.unit_type : ' adet'}`,
                    it.gross_weight_kg != null && `${Number(it.gross_weight_kg).toLocaleString('tr-TR')} kg`,
                    it.volume_cbm != null && `${Number(it.volume_cbm).toLocaleString('tr-TR')} m³`,
                    it.package_type,
                    it.container_no && `Konteyner: ${it.container_no}`,
                  ].filter(Boolean);
                  const refs = [
                    ['Müşteri Ref.', it.customer_reference],
                    ['GTIP', it.gtip_code],
                    ['HS Kod', it.hs_code],
                    ['Yük Ref.', it.cargo_reference_no],
                    ['Barkod', it.barcode],
                    ['Lot No', it.lot_no],
                    ['Seri No', it.serial_no],
                    ['MRN', it.mrn_no],
                    ['UN No', it.un_number],
                    ['IMDG', it.imdg_code],
                    ['PO No', it.po_number],
                  ].filter(([, v]) => v);
                  return (
                    <div key={it.id || i} className="text-sm border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                      <p className="font-medium text-gray-800">
                        {it.item_no ? `#${it.item_no} · ` : ''}{it.description || it.trade_name || 'Kalem'}
                      </p>
                      {details.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">{details.join(' · ')}</p>
                      )}
                      {(it.hazardous_material || it.hazardous_class) && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Tehlikeli Madde{it.hazardous_class ? ` (${it.hazardous_class})` : ''}
                        </span>
                      )}
                      {refs.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                          {refs.map(([label, val]) => (
                            <span key={label} className="text-xs text-gray-400">
                              {label}: <span className="text-gray-600 font-medium">{val}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Driver info */}
          {(order.driver_name || order.vehicle_plate) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Araç & Sürücü</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {order.driver_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{order.driver_name}</span>
                  </div>
                )}
                {order.driver_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${order.driver_phone}`} className="text-blue-600">{order.driver_phone}</a>
                  </div>
                )}
                {order.vehicle_plate && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{order.vehicle_plate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking */}
          {tracking.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Kargo Takip</h2>
              <div className="space-y-3">
                {tracking.map(t => (
                  <div key={t.id} className="flex gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">{t.current_location || t.status}</p>
                      {t.note && <p className="text-gray-500 text-xs">{t.note}</p>}
                      <p className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents / POD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Belgeler ve Teslim Kanıtı
            </h2>
            {documents.length === 0 && deliverySignatures.length === 0 ? (
              <p className="text-xs text-gray-400">Bu sipariş için müşteri görünür belge veya teslim imzası bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {documents.map(document => (
                  <div key={document.id} className="flex items-center justify-between gap-3 border-b border-gray-50 last:border-0 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{document.file_name}</p>
                      <p className="text-xs text-gray-400">{document.trip_no ? `Sefer: ${document.trip_no} · ` : ''}{document.file_type || 'Belge'} · {new Date(document.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                    {document.file_url && (
                      <a href={document.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 shrink-0">
                        <Download className="w-3.5 h-3.5" /> Aç
                      </a>
                    )}
                  </div>
                ))}
                {deliverySignatures.map(signature => (
                  <div key={signature.id} className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-600" /> Teslim imzası</p>
                      <p className="text-xs text-gray-400">{signature.signer_name || 'İmzalayan belirtilmemiş'} · {new Date(signature.signed_at).toLocaleString('tr-TR')}</p>
                    </div>
                    {signature.signature_url && (
                      <a href={signature.signature_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 shrink-0">
                        <Download className="w-3.5 h-3.5" /> İmzayı aç
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finance */}
          {finance.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Faturalar</h2>
              <div className="space-y-2">
                {finance.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{f.description || 'Fatura'}</p>
                      {f.invoice_no && <p className="text-xs text-gray-400">#{f.invoice_no}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{Number(f.remaining_amount ?? f.total_amount ?? 0).toLocaleString('tr-TR')} {f.currency}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${String(f.billing_status || '').toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {String(f.billing_status || '').toUpperCase() === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Status timeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Operasyon Durakları</h2>
            {milestones.length === 0 ? (
              <p className="text-xs text-gray-400">Bu sipariş için planlı durak bilgisi bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((stop, index) => {
                  const completed = Boolean(stop.actual_arrival || stop.actual_departure);
                  return <div key={stop.id || index} className="flex gap-3">
                    <div className={`mt-1 w-3 h-3 rounded-full border-2 ${completed ? 'bg-green-500 border-green-500' : 'bg-white border-blue-500'}`} />
                    <div className="min-w-0"><p className="text-sm font-medium text-gray-800">{stop.stop_order != null ? `${stop.stop_order}. ` : ''}{stop.stop_type || 'Durak'}{stop.city ? ` · ${stop.city}` : ''}</p><p className="text-xs text-gray-500">{stop.address || 'Adres bilgisi yok'}</p><p className="text-xs text-gray-400 mt-1">Planlanan: {stop.planned_arrival ? new Date(stop.planned_arrival).toLocaleString('tr-TR') : 'Belirtilmemiş'}{completed && ` · Gerçekleşen: ${new Date(stop.actual_arrival || stop.actual_departure).toLocaleString('tr-TR')}`}</p></div>
                  </div>;
                })}
              </div>
            )}
          </div>

          {exceptions.length > 0 && <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <h2 className="font-semibold text-red-800 mb-3">Operasyon İstisnaları</h2>
            <div className="space-y-3">{exceptions.map(exception => <div key={exception.id} className="border-b border-red-100 last:border-0 pb-3 last:pb-0"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-red-900">{exception.title}</p><span className="text-xs text-red-700">{exception.status}</span></div>{exception.description && <p className="text-xs text-red-800 mt-1">{exception.description}</p>}<p className="text-xs text-red-600 mt-1">{new Date(exception.occurred_at).toLocaleString('tr-TR')}{exception.resolved_at ? ` · Çözüldü: ${new Date(exception.resolved_at).toLocaleString('tr-TR')}` : ''}</p></div>)}</div>
          </div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-gray-800">Hasar ve İtirazlar</h2>
              <button type="button" onClick={() => { setClaimOpen(v => !v); setClaimError(''); }} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                {claimOpen ? 'Formu kapat' : 'Yeni itiraz bildir'}
              </button>
            </div>

            {claimOpen && (
              <form onSubmit={async event => {
                event.preventDefault();
                setClaimSaving(true); setClaimError('');
                try {
                  await customerApi.post(`/orders/${id}/claims`, {
                    ...claimForm,
                    quantity: claimForm.quantity || undefined,
                    occurredAt: claimForm.occurredAt || undefined,
                  });
                  const refreshed = await customerApi.get(`/orders/${id}`);
                  setData(refreshed.data.data);
                  setClaimOpen(false);
                  setClaimForm({ claimType: 'damage', priority: 'high', quantity: '', unit: '', occurredAt: '', description: '' });
                } catch (err) {
                  setClaimError(err.response?.data?.message || 'İtiraz kaydı oluşturulamadı.');
                } finally { setClaimSaving(false); }
              }} className="space-y-3 border-t border-gray-100 pt-3 mb-4">
                {claimError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{claimError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={claimForm.claimType} onChange={e => setClaimForm(p => ({ ...p, claimType: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="damage">Hasarlı teslim</option>
                    <option value="shortage">Eksik teslim</option>
                    <option value="delay">Gecikme</option>
                    <option value="wrong_address">Yanlış adres</option>
                    <option value="pod_dispute">POD itirazı</option>
                    <option value="other">Diğer</option>
                  </select>
                  <select value={claimForm.priority} onChange={e => setClaimForm(p => ({ ...p, priority: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="normal">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                  <input type="number" min="0" step="any" placeholder="Etkilenen miktar" value={claimForm.quantity} onChange={e => setClaimForm(p => ({ ...p, quantity: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Birim (koli, palet...)" value={claimForm.unit} onChange={e => setClaimForm(p => ({ ...p, unit: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <input type="datetime-local" value={claimForm.occurredAt} onChange={e => setClaimForm(p => ({ ...p, occurredAt: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <textarea required rows={3} placeholder="Olayı ve beklentinizi açıklayın..." value={claimForm.description} onChange={e => setClaimForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                <button type="submit" disabled={claimSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{claimSaving ? 'Kaydediliyor...' : 'İtirazı gönder'}</button>
              </form>
            )}

            {claims.length === 0 ? (
              <p className="text-xs text-gray-400">Bu siparişe bağlı itiraz kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-2">{claims.map(claim => <div key={claim.id} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-gray-800">{claim.subject}</p><span className="text-xs text-gray-500">{claim.status}</span></div><p className="text-xs text-gray-500 mt-1 whitespace-pre-line line-clamp-3">{claim.description}</p><p className="text-xs text-gray-400 mt-1">{claim.ticket_no} · {new Date(claim.created_at).toLocaleString('tr-TR')}</p></div>)}</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Durum Geçmişi</h2>
            {statusHistory.length === 0 ? (
              <p className="text-xs text-gray-400">Henüz durum güncellemesi yok.</p>
            ) : (
              <ol className="relative border-l-2 border-gray-200 space-y-4 ml-2">
                {statusHistory.map((s, i) => (
                  <li key={i} className="ml-4">
                    <div className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                    <p className="text-sm font-medium text-gray-800">{orderStatusLabel(s.status)}</p>
                    {s.note && <p className="text-xs text-gray-500">{s.note}</p>}
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString('tr-TR')}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Notlar</h2>
              <div className="space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{n.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

