import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Truck, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, verifyTwoFactorLogin }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [twoFactor, setTwoFactor] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (twoFactor?.twoFactorToken) {
        const userData = await verifyTwoFactorLogin(twoFactor.portalType, twoFactor.twoFactorToken, otpCode);
        navigate(userData.portalType === 'customer' ? '/c' : '/');
        return;
      }

      const userData = await login(form.email, form.password);
      if (userData?.requiresTwoFactor) {
        setTwoFactor(userData);
        setOtpCode('');
        setForm(p => ({ ...p, password: '' }));
        return;
      }
      // Role'e göre yönlendir
      navigate(userData.portalType === 'customer' ? '/c' : '/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NCMSoft</h1>
          <p className="text-blue-300 text-sm mt-1">Lojistik Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {twoFactor ? 'Authenticator Doğrulaması' : 'Giriş Yap'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {twoFactor
              ? 'Hesabınıza erişmek için Google Authenticator kodunu girin.'
              : <>Hesabınıza erişmek için bilgilerinizi girin.<br/><span className="text-xs text-gray-400">Tedarikçi ve müşteri hesapları desteklenir.</span></>}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!twoFactor ? (
              <>
                <div>
                  <label className="label">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-9"
                      placeholder="tedarikci@firma.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      className="input pl-9"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {twoFactor.provisioning?.secret && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="text-sm font-semibold text-blue-900">Kurulum anahtarı</div>
                    <div className="mt-2 break-all rounded bg-white px-3 py-2 font-mono text-xs text-blue-950">
                      {twoFactor.provisioning.secret}
                    </div>
                    <a
                      href={twoFactor.provisioning.otpauthUrl}
                      className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Authenticator uygulamasında aç
                    </a>
                  </div>
                )}
                <div>
                  <label className="label">6 haneli kod</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="input"
                    placeholder="123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : twoFactor ? 'Doğrula ve giriş yap' : 'Giriş Yap'}
            </button>

            {twoFactor && (
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-gray-500 hover:text-blue-700"
                onClick={() => {
                  setTwoFactor(null);
                  setOtpCode('');
                  setError('');
                }}
              >
                E-posta ve şifreye geri dön
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} NCMSoft Lojistik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}

