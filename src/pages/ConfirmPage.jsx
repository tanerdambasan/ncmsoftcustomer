import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, AlertCircle, Truck, MapPin, Weight, Clock } from 'lucide-react';

const PLATE_RE  = /^[0-9A-ZÇĞİÖŞÜa-zçğıöşü\s\-]{2,15}$/;
const PHONE_RE  = /^\+?[0-9\s\-().]{7,20}$/;

function Countdown({ deadline }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    if (!deadline) return;
    function tick() {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setLeft('Süre Doldu'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${m}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (!deadline) return null;
  const urgent = new Date(deadline) - Date.now() < 600000;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
      left === 'Süre Doldu' ? 'bg-red-100 text-red-700' : urgent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
    }`}>
      <Clock className="w-4 h-4" />
      {left === 'Süre Doldu' ? 'Onay süreniz dolmuştur.' : `Kalan süre: ${left}`}
    </div>
  );
}

export default function ConfirmPage() {
  const { token } = useParams();

  const [info, setInfo]         = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading]   = useState(true);

  const [action, setAction]     = useState(''); // 'confirm' | 'reject'
  const [form, setForm]         = useState({ driverName: '', driverPhone: '', vehiclePlate: '', rejectionReason: '' });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null); // success result
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await axios.get(`/api/supplier/confirm/${token}`);
        if (res.data.success) {
          setInfo(res.data.data);
          if (res.data.data.status === 'already_confirmed') {
            setResult({ action: 'already_confirmed' });
          }
        }
      } catch (e) {
        setLoadError(e.response?.data?.message || 'Geçersiz veya süresi dolmuş onay linki.');
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [token]);

  function validate() {
    const errs = {};
    if (action === 'confirm') {
      if (!form.driverName.trim() || form.driverName.trim().length < 3)
        errs.driverName = 'Sürücü adı soyadı zorunlu (en az 3 karakter).';
      if (!PHONE_RE.test(form.driverPhone.trim()))
        errs.driverPhone = 'Geçerli bir telefon numarası giriniz.';
      if (!PLATE_RE.test(form.vehiclePlate.trim()))
        errs.vehiclePlate = 'Geçerli bir plaka giriniz. Örn: 34 ABC 001';
    }
    if (action === 'reject') {
      if (!form.rejectionReason.trim() || form.rejectionReason.trim().length < 5)
        errs.rejectionReason = 'Red nedeni zorunludur (en az 5 karakter).';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true); setSubmitError('');
    try {
      const payload = { action };
      if (action === 'confirm') {
        payload.driverName   = form.driverName.trim();
        payload.driverPhone  = form.driverPhone.trim();
        payload.vehiclePlate = form.vehiclePlate.trim().toUpperCase();
      } else {
        payload.rejectionReason = form.rejectionReason.trim();
      }
      const res = await axios.post(`/api/supplier/confirm/${token}`, payload);
      setResult(res.data.data);
    } catch (e) {
      setSubmitError(e.response?.data?.message || 'İşlem başarısız. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Link doğrulanıyor…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Geçersiz Link</h2>
          <p className="text-gray-500 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (result) {
    const isConfirmed = result.action === 'confirmed' || result.action === 'already_confirmed';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          {isConfirmed ? (
            <>
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {result.action === 'already_confirmed' ? 'Zaten Onaylandı' : 'İhale Onaylandı!'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {result.action === 'already_confirmed'
                  ? 'Bu ihale daha önce onaylanmıştır.'
                  : `Sefer başarıyla oluşturuldu. Sefer No: ${result.tripNo || '—'}`}
              </p>
              {result.tripNo && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 font-mono text-lg font-bold">
                  {result.tripNo}
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Teklif Reddedildi</h2>
              <p className="text-gray-500 text-sm">İhale reddedilmiştir. Müşteri temsilcisi bilgilendirilecektir.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const bid = info?.bid;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">İhale Onay Ekranı</h1>
          <p className="text-gray-500 text-sm mt-1">NCMSoft Tedarikçi Portalı</p>
        </div>

        {/* Countdown */}
        {info?.expires && (
          <div className="flex justify-center mb-6">
            <Countdown deadline={info.expires} />
          </div>
        )}

        {/* Tender & Bid Info */}
        {bid && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">İhale Detayı</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">Güzergah: </span>
                  <span className="text-gray-600">{bid.baslangic || '—'} → {bid.varis || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium text-gray-700">Teklif Tutarınız: </span>
                <span className="text-blue-700 font-bold text-base">
                  {Number(bid.tutar).toLocaleString('tr-TR')} {bid.paraBirimi}
                </span>
              </div>
              {bid.aciklama && (
                <p className="text-gray-500 italic">"{bid.aciklama}"</p>
              )}
            </div>
          </div>
        )}

        {/* Action Choice */}
        {!action && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Kararınızı Bildirin</h2>
            <p className="text-gray-500 text-sm mb-5">
              Bu ihaleyi onaylamak mı yoksa reddetmek mi istiyorsunuz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAction('confirm')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> Onayla
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" /> Reddet
              </button>
            </div>
          </div>
        )}

        {/* Confirm Form */}
        {action === 'confirm' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setAction('')} className="text-gray-400 hover:text-gray-700 text-sm">← Geri</button>
              <h2 className="font-semibold text-gray-900">Sürücü ve Araç Bilgileri</h2>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Sürücü Adı Soyadı *</label>
                <input className={`input ${errors.driverName ? 'border-red-400' : ''}`}
                  placeholder="Ahmet Yılmaz"
                  value={form.driverName}
                  onChange={e => setForm(p => ({ ...p, driverName: e.target.value }))} />
                {errors.driverName && <p className="text-red-500 text-xs mt-1">{errors.driverName}</p>}
              </div>

              <div>
                <label className="label">Sürücü Telefonu *</label>
                <input className={`input ${errors.driverPhone ? 'border-red-400' : ''}`}
                  placeholder="+90 500 000 00 00"
                  value={form.driverPhone}
                  onChange={e => setForm(p => ({ ...p, driverPhone: e.target.value }))} />
                {errors.driverPhone && <p className="text-red-500 text-xs mt-1">{errors.driverPhone}</p>}
              </div>

              <div>
                <label className="label">Araç Plakası *</label>
                <input className={`input uppercase ${errors.vehiclePlate ? 'border-red-400' : ''}`}
                  placeholder="34 ABC 001"
                  value={form.vehiclePlate}
                  onChange={e => setForm(p => ({ ...p, vehiclePlate: e.target.value }))} />
                {errors.vehiclePlate && <p className="text-red-500 text-xs mt-1">{errors.vehiclePlate}</p>}
                <p className="text-gray-400 text-xs mt-1">Bu bilgiler girilmeden kesin onay verilemez.</p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                disabled={submitting || !form.driverName || !form.driverPhone || !form.vehiclePlate}
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Onaylanıyor…' : 'Kesin Onay Ver'}
              </button>
            </form>
          </div>
        )}

        {/* Reject Form */}
        {action === 'reject' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setAction('')} className="text-gray-400 hover:text-gray-700 text-sm">← Geri</button>
              <h2 className="font-semibold text-gray-900">Red Gerekçesi</h2>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Red Nedeni *</label>
                <textarea rows={4} className={`input resize-none ${errors.rejectionReason ? 'border-red-400' : ''}`}
                  placeholder="Örn: Araç müsait değil, fiyat uygun değil…"
                  value={form.rejectionReason}
                  onChange={e => setForm(p => ({ ...p, rejectionReason: e.target.value }))} />
                {errors.rejectionReason && <p className="text-red-500 text-xs mt-1">{errors.rejectionReason}</p>}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                <XCircle className="w-5 h-5" />
                {submitting ? 'Gönderiliyor…' : 'Teklifi Reddet'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} NCMSoft Lojistik · Bu link size özel üretilmiştir.
        </p>
      </div>
    </div>
  );
}

