/**
 * cartUtils.js — Cart status colors, helpers, and formatters.
 */

export const CART_STATUS_LIST = ['active', 'converted', 'abandoned'];

/** MUI-compatible sx color objects for cart status */
export const CART_STATUS_COLORS = {
  active:    { bgcolor: '#D8F3DC', color: '#166534' },
  converted: { bgcolor: '#DBEAFE', color: '#1D4ED8' },
  abandoned: { bgcolor: '#F1F5F9', color: '#475569' },
};

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format ISO string → "26 Jun 2026, 10:00 AM" */
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/** Format ISO string → "26 Jun 2026" */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Format decimal/number → "₹1,299.00" */
export function formatAmount(val) {
  if (val === null || val === undefined || val === '') return '—';
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

/**
 * Client-side optimistic subtotal + total_items recalculation.
 * Tax, shipping, discount come from the backend — not recalculated here.
 */
export function recalculateCart(items = []) {
  const subtotal    = items.reduce((sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0);
  const total_items = items.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, total_items };
}
