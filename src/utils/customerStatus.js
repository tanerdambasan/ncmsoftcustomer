export const ORDER_STATUS_LABELS = {
  draft: 'Taslak',
  open: 'Talep Açık',
  planned: 'Planlandı',
  loading: 'Yükleme Aşamasında',
  in_transit: 'Taşımada',
  at_customs: 'Gümrükte',
  arrived: 'Varış Noktasında',
  delivered: 'Teslim Edildi',
  completed: 'Tamamlandı',
  ready_to_invoice: 'Faturalama Bekliyor',
  invoiced: 'Faturalandı',
  closed: 'Kapatıldı',
  cancelled: 'İptal Edildi',
};

export const ORDER_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-blue-100 text-blue-700',
  planned: 'bg-indigo-100 text-indigo-700',
  loading: 'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-amber-100 text-amber-700',
  at_customs: 'bg-orange-100 text-orange-700',
  arrived: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  ready_to_invoice: 'bg-purple-100 text-purple-700',
  invoiced: 'bg-violet-100 text-violet-700',
  closed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const ACTIVE_ORDER_STATUSES = [
  'open', 'planned', 'loading', 'in_transit', 'at_customs', 'arrived',
];

export function orderStatusLabel(status) {
  const key = String(status || '').trim().toLowerCase();
  return ORDER_STATUS_LABELS[key] || status || 'Bilinmiyor';
}

export function orderStatusColor(status) {
  const key = String(status || '').trim().toLowerCase();
  return ORDER_STATUS_COLORS[key] || 'bg-gray-100 text-gray-600';
}
