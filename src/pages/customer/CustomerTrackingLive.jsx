import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import customerApi from '../../api/customerClient';
import { MapPin, Truck, Phone, User, Search, RefreshCw, Clock, Navigation, Package } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// ── Leaflet ikon düzeltmesi ──────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Araç ikonu ───────────────────────────────────────────────
const truckIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;border:3px solid #fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(37,99,235,0.5);font-size:18px;">🚛</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20], className: '',
});

// ── Hedef ikonu ──────────────────────────────────────────────
const destIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;border:3px solid #fff;border-radius:50% 50% 50% 0;width:32px;height:32px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);font-size:14px;">📍</span></div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34], className: '',
});

// ── Harita controller ────────────────────────────────────────
function MapController({ liveLocation, destination, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!liveLocation) return;
    try {
      if (destination) {
        const bounds = L.latLngBounds([liveLocation, destination]);
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 9, animate: true });
      } else {
        map.setView(liveLocation, 7, { animate: true });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

// ── Yardımcılar ──────────────────────────────────────────────
const STATUS_CFG = {
  new:        { label: 'Sipariş Oluşturuldu', icon: '📋', dot: '#3b82f6' },
  confirmed:  { label: 'Onaylandı',           icon: '✅', dot: '#8b5cf6' },
  in_transit: { label: 'Yola Çıktı',          icon: '🚛', dot: '#f59e0b' },
  at_customs: { label: 'Gümrük İşlemi',       icon: '🏛️', dot: '#f97316' },
  delivered:  { label: 'Teslim Edildi',        icon: '📦', dot: '#22c55e' },
  cancelled:  { label: 'İptal Edildi',         icon: '❌', dot: '#ef4444' },
};

const slugLabel = (s) => STATUS_CFG[s]?.label || s;
const fmtKm  = (m) => m >= 1000 ? `${(m / 1000).toFixed(0)} km` : `${m} m`;
const fmtHr  = (s) => { const h = Math.floor(s / 3600); const m = Math.round((s % 3600) / 60); return h > 0 ? `${h} sa ${m > 0 ? m + ' dk' : ''}` : `${m} dk`; };
const fmtDT  = (d) => d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtD   = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const ACTIVE_ST = ['new', 'confirmed', 'in_transit', 'at_customs'];

// ════════════════════════════════════════════════════════════
export default function CustomerTrackingLive() {
  const [orders, setOrders]             = useState([]);
  const [selected, setSelected]         = useState(null);
  const [trackData, setTrackData]       = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [destination, setDestination]   = useState(null);
  const [routeCoords, setRouteCoords]   = useState(null);
  const [routeInfo, setRouteInfo]       = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);
  const [fitTrigger, setFitTrigger]     = useState(0);
  const socketRef = useRef(null);

  // Socket.IO
  useEffect(() => {
    const s = io('http://localhost:3000', { transports: ['polling'], reconnection: true });
    socketRef.current = s;
    return () => s.disconnect();
  }, []);

  // Aktif siparişler
  useEffect(() => {
    Promise.all([
      customerApi.get('/orders', { params: { limit: 50, status: 'in_transit' } }),
      customerApi.get('/orders', { params: { limit: 50, status: 'at_customs' } }),
    ]).then(([r1, r2]) => {
      setOrders([...(r1.data.data.orders || []), ...(r2.data.data.orders || [])]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // OSRM rota
  const fetchRoute = useCallback(async (from, to) => {
    if (!from || !to) return;
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.routes?.[0]) {
        setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        setRouteInfo({ distance: data.routes[0].distance, duration: data.routes[0].duration });
      } else {
        setRouteCoords([from, to]);
      }
    } catch {
      setRouteCoords([from, to]);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // Sipariş seç
  const loadTracking = async (orderId) => {
    setSelected(orderId); setTrackLoading(true);
    setLiveLocation(null); setDestination(null);
    setRouteCoords(null);  setRouteInfo(null);
    try {
      const { data: res } = await customerApi.get(`/orders/${orderId}/tracking`);
      const d = res.data;
      setTrackData(d);

      let loc = null, dest = null;
      if (d.currentPosition?.lat && d.currentPosition?.lng) {
        loc  = [Number(d.currentPosition.lat), Number(d.currentPosition.lng)];
        setLiveLocation(loc);
      }
      if (d.order?.delivery_lat && d.order?.delivery_lng) {
        dest = [Number(d.order.delivery_lat), Number(d.order.delivery_lng)];
        setDestination(dest);
      }

      setFitTrigger(t => t + 1);
      if (loc && dest) fetchRoute(loc, dest);

      socketRef.current?.emit('customer:track_order', orderId);
    } catch {}
    setTrackLoading(false);
  };

  // Gerçek zamanlı konum
  useEffect(() => {
    if (!socketRef.current || !selected) return;
    const h = (d) => {
      if (d.orderId === selected || d.driverId) {
        const loc = [Number(d.lat), Number(d.lng)];
        setLiveLocation(loc);
        setFitTrigger(t => t + 1);
        if (destination) fetchRoute(loc, destination);
      }
    };
    socketRef.current.on('driver:location_update', h);
    return () => {
      socketRef.current?.off('driver:location_update', h);
      socketRef.current?.emit('customer:untrack_order', selected);
    };
  }, [selected, destination]);

  const filtered = orders.filter(o => !search || o.order_no.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" /> Canlı Takip
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* ── SOL: Liste ───────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Sipariş no ara..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">Aktif sefer yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(o => (
                <button key={o.id} onClick={() => loadTracking(o.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selected === o.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}>
                  <p className="font-semibold text-sm text-gray-800">{o.order_no}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.service_type?.toUpperCase()} · {slugLabel(o.status)}</p>
                  {o.driver_name && <p className="text-xs text-gray-400 mt-0.5">🧑 {o.driver_name}</p>}
                  {o.vehicle_plate && <p className="text-xs text-gray-400">🚛 {o.vehicle_plate}</p>}
                  {liveLocation && selected === o.id && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">Canlı konum aktif</span>
                    </div>
                  )}
                  {routeInfo && selected === o.id && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600">
                      <Navigation className="w-3 h-3" />
                      <span>{fmtKm(routeInfo.distance)} · {fmtHr(routeInfo.duration)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── SAĞ: Harita + Panel ──────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Harita */}
          <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 520 }}>
            {(trackLoading || routeLoading) && (
              <div className="absolute inset-0 z-[1500] flex flex-col items-center justify-center bg-white/80">
                <div className="animate-spin w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full mb-2" />
                <p className="text-xs text-gray-500">{trackLoading ? 'Takip verisi yükleniyor…' : 'Rota hesaplanıyor…'}</p>
              </div>
            )}
            {!selected && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-xs">
                  <MapPin className="w-14 h-14 mb-3 text-gray-200 mx-auto" />
                  <p className="text-sm font-medium text-gray-500">Sol panelden aktif bir sefer seçin</p>
                  <p className="text-xs text-gray-400 mt-1">Araç konumu ve rota haritada görünecek</p>
                </div>
              </div>
            )}
            {/* Rota rozeti */}
            {routeInfo && !routeLoading && (
              <div className="absolute top-3 right-3 z-[999] bg-white/95 backdrop-blur rounded-xl shadow-md px-3 py-2 flex items-center gap-2 text-sm border border-gray-100">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-800">{fmtKm(routeInfo.distance)}</span>
                <span className="text-gray-300">·</span>
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">{fmtHr(routeInfo.duration)}</span>
              </div>
            )}

            <MapContainer center={[48, 15]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController liveLocation={liveLocation} destination={destination} trigger={fitTrigger} />

              {/* Rota çizgisi */}
              {routeCoords && routeCoords.length > 1 && (
                <Polyline positions={routeCoords}
                  pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8, lineJoin: 'round', lineCap: 'round' }} />
              )}

              {/* Araç */}
              {liveLocation && (
                <Marker position={liveLocation} icon={truckIcon}>
                  <Popup>
                    <div className="text-sm leading-relaxed">
                      <p className="font-bold text-blue-700">🚛 Araç Konumu</p>
                      {trackData?.order?.driver_name && <p className="mt-1">👤 {trackData.order.driver_name}</p>}
                      {trackData?.order?.vehicle_plate && (
                        <p className="font-mono font-bold bg-gray-100 px-1 rounded text-gray-700 mt-0.5 inline-block">
                          {trackData.order.vehicle_plate}
                        </p>
                      )}
                      {trackData?.currentPosition?.current_location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {trackData.currentPosition.current_location}</p>
                      )}
                      <p className="text-xs text-green-600 font-medium mt-1">● Canlı Konum</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Teslimat */}
              {destination && (
                <Marker position={destination} icon={destIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-green-700">📦 Teslimat Noktası</p>
                      {trackData?.order?.eta && <p className="text-xs text-gray-600 mt-1">⏰ ETA: {fmtD(trackData.order.eta)}</p>}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* ── Alt Panel: Rota Bilgisi + Zaman Çizelgesi ── */}
          {selected && trackData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Başlık */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-800">{trackData.order.order_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    trackData.order.status === 'in_transit' ? 'bg-yellow-100 text-yellow-700' :
                    trackData.order.status === 'at_customs' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{slugLabel(trackData.order.status)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {trackData.order.eta && (
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-400">ETA</p>
                      <p className="text-sm font-bold text-gray-800">{fmtD(trackData.order.eta)}</p>
                    </div>
                  )}
                  <button onClick={() => loadTracking(selected)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                {/* Sol: Araç + Rota Özeti */}
                <div className="p-5 space-y-4">
                  {/* Araç Bilgisi */}
                  {(trackData.order.driver_name || trackData.order.vehicle_plate) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Araç & Sürücü</p>
                      <div className="flex flex-wrap gap-2">
                        {trackData.order.driver_name && (
                          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 text-sm px-3 py-1.5 rounded-lg">
                            <User className="w-3.5 h-3.5" />{trackData.order.driver_name}
                          </span>
                        )}
                        {trackData.order.driver_phone && (
                          <a href={`tel:${trackData.order.driver_phone}`}
                            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5" />{trackData.order.driver_phone}
                          </a>
                        )}
                        {trackData.order.vehicle_plate && (
                          <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg font-mono font-bold">
                            <Truck className="w-3.5 h-3.5 text-gray-500" />{trackData.order.vehicle_plate}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rota Özeti */}
                  {routeInfo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rota Özeti</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-blue-700">{fmtKm(routeInfo.distance)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Kalan Mesafe</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-amber-600">{fmtHr(routeInfo.duration)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Tahmini Süre</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Son Konum */}
                  {trackData.currentPosition?.current_location && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mevcut Konum</p>
                      <div className="flex items-start gap-2 bg-green-50 rounded-xl p-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{trackData.currentPosition.current_location}</p>
                          {trackData.currentPosition.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{trackData.currentPosition.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ: Zaman Çizelgesi */}
                <div className="p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Sevkiyat Süreci</p>
                  {trackData.events?.length > 0 ? (
                    <ol className="relative">
                      <div className="absolute left-[13px] top-4 bottom-12 w-0.5 bg-gradient-to-b from-blue-400 to-gray-200" />
                      {trackData.events.map((ev, i) => {
                        const key   = ev.new_status || ev.status;
                        const cfg   = STATUS_CFG[key] || STATUS_CFG.new;
                        const isLast = i === trackData.events.length - 1;
                        return (
                          <li key={i} className="flex gap-3 pb-4 relative">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-sm
                              border-2 ${isLast ? 'border-transparent shadow-md' : 'border-gray-200 bg-white'}`}
                              style={{ backgroundColor: isLast ? cfg.dot : undefined }}>
                              {isLast ? cfg.icon : <span style={{ color: cfg.dot }}>✓</span>}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className={`text-sm font-semibold ${isLast ? 'text-gray-900' : 'text-gray-500'}`}>
                                {cfg.label}
                              </p>
                              {ev.note && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ev.note}</p>}
                              <p className={`text-xs mt-1 ${isLast ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                {fmtDT(ev.changed_at || ev.created_at)}
                              </p>
                            </div>
                          </li>
                        );
                      })}

                      {/* Beklenen Teslim */}
                      {ACTIVE_ST.includes(trackData.order.status) && (
                        <li className="flex gap-3 relative">
                          <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center flex-shrink-0 z-10 text-sm">
                            📦
                          </div>
                          <div className="pt-0.5">
                            <p className="text-sm text-gray-400">Teslim Edilecek</p>
                            {trackData.order.eta && (
                              <p className="text-xs text-gray-400 mt-0.5">Tahmini: {fmtD(trackData.order.eta)}</p>
                            )}
                          </div>
                        </li>
                      )}
                    </ol>
                  ) : (
                    <div className="text-center py-6 text-gray-300">
                      <Clock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Durum geçmişi yok</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

