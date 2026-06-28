/**
 * orderUtils.js — Order status transitions, colors, and shared helpers.
 */

export const ORDER_STATUS_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed:     ['shipped', 'cancelled'],
  shipped:    ['delivered', 'return'],
  delivered:  ['return', 'reorder'],
  reorder:    ['processing'],
  cancelled:  [],
  return:     [],
};

export const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing', 'packed'];

export const ORDER_STATUS_LIST = [
  'pending', 'confirmed', 'processing', 'packed',
  'shipped', 'delivered', 'cancelled', 'return', 'reorder',
];

export const PAYMENT_STATUS_LIST = ['pending', 'paid', 'fail', 'refunded'];

/** Pipeline steps for the visual tracker (main flow only) */
export const PIPELINE_STEPS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];

/** MUI-compatible sx color objects for order_status */
export const ORDER_STATUS_COLORS = {
  pending:    { bgcolor: '#FEF3C7', color: '#92400E' },
  confirmed:  { bgcolor: '#DBEAFE', color: '#1D4ED8' },
  processing: { bgcolor: '#EDE9FE', color: '#6D28D9' },
  packed:     { bgcolor: '#F3E8FF', color: '#7C3AED' },
  shipped:    { bgcolor: '#CFFAFE', color: '#0E7490' },
  delivered:  { bgcolor: '#D8F3DC', color: '#166534' },
  cancelled:  { bgcolor: '#FEE2E2', color: '#B91C1C' },
  return:     { bgcolor: '#FFEDD5', color: '#C2410C' },
  reorder:    { bgcolor: '#CCFBF1', color: '#0F766E' },
};

/** MUI-compatible sx color objects for payment_status */
export const PAYMENT_STATUS_COLORS = {
  pending:  { bgcolor: '#FEF3C7', color: '#92400E' },
  paid:     { bgcolor: '#D8F3DC', color: '#166534' },
  fail:     { bgcolor: '#FEE2E2', color: '#B91C1C' },
  refunded: { bgcolor: '#EDE9FE', color: '#6D28D9' },
};

/** Returns allowed next statuses from the current one. */
export function getAllowedNextStatuses(currentStatus) {
  return ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/** Returns true if the order can be cancelled from this status. */
export function isOrderCancellable(status) {
  return CANCELLABLE_STATUSES.includes(status);
}

/** Capitalize first letter. */
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

/** Build a single-line display address from an address object. */
export function buildAddressLine(address) {
  if (!address) return '—';
  return [
    address.address_line_1,
    address.address_line_2,
    address.landmark,
    address.city?.name,
    address.state?.name,
    address.country?.name,
    address.postal_code,
  ].filter(Boolean).join(', ');
}
