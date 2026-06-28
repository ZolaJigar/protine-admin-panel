// ─────────────────────────────────────────────────────────────────────────────
// constants/values.js
// Central registry of all shared constant values used across the admin panel.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default rows per page for all paginated tables */
export const DEFAULT_LIMIT = 10;

/** Limit used on the logs page (intentionally larger) */
export const LOGS_LIMIT = 25;

/** Large limit used when fetching full lookup lists for dropdowns */
export const DROPDOWN_FETCH_LIMIT = 100;

/** Large limit used when fetching all permissions for role forms */
export const PERMISSIONS_FETCH_LIMIT = 200;

// ─── File Upload ──────────────────────────────────────────────────────────────

/** MIME types accepted for standard image uploads (product, category, banner, user avatar) */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * MIME types accepted for theme / branding uploads.
 * Extends the standard set with SVG and ICO for favicon / logo use-cases.
 */
export const ACCEPTED_THEME_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/x-icon',
  'image/svg+xml',
];

/** Maximum allowed file size for image uploads: 5 MB */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ─── Product / Variant ────────────────────────────────────────────────────────

/** Weight / volume unit options for product variants */
export const WEIGHT_UNITS = ['g', 'kg', 'ltr', 'ml'];

// ─── User / Profile ───────────────────────────────────────────────────────────

/** Gender options for user profiles */
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

/**
 * Color palette for user role chips.
 * Keys map to role slugs; `default` is used for any unrecognised role.
 */
export const ROLE_COLORS = {
  super_admin: { bgcolor: '#FEE2E2', color: '#B91C1C' },
  admin:       { bgcolor: '#E0F2FE', color: '#0369A1' },
  default:     { bgcolor: '#D8F3DC', color: '#1B4332' },
};

// ─── Banner Pages ─────────────────────────────────────────────────────────────

/** Page location options for banners */
export const BANNER_PAGE_OPTIONS = [
  { label: 'All Pages', value: '' },
  { label: 'Home',      value: 'home' },
  { label: 'Product',   value: 'product' },
  { label: 'Category',  value: 'category' },
  { label: 'About',     value: 'about' },
  { label: 'Contact',   value: 'contact' },
];

/**
 * Chip color palette for banner page values.
 * Keys correspond to the `value` field in BANNER_PAGE_OPTIONS.
 */
export const BANNER_PAGE_COLORS = {
  home:     { bg: '#D8F3DC', color: '#1B4332' },
  product:  { bg: '#DBEAFE', color: '#1D4ED8' },
  category: { bg: '#FEF3C7', color: '#92400E' },
  about:    { bg: '#EDE9FE', color: '#7C3AED' },
  contact:  { bg: '#F1F5F9', color: '#475569' },
};

// ─── Address Types ────────────────────────────────────────────────────────────

/** Address type filter options */
export const ADDRESS_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Home',      value: 'home' },
  { label: 'Office',    value: 'office' },
  { label: 'Resident',  value: 'resident' },
  { label: 'Other',     value: 'other' },
];

/** Chip color palette for address types */
export const ADDRESS_TYPE_COLORS = {
  home:     { bg: '#D8F3DC', color: '#1B4332' },
  office:   { bg: '#DBEAFE', color: '#1D4ED8' },
  resident: { bg: '#FEF3C7', color: '#92400E' },
  other:    { bg: '#F1F5F9', color: '#475569' },
};

/** Filter options for the default-address flag */
export const ADDRESS_DEFAULT_OPTIONS = [
  { label: 'All',         value: '' },
  { label: 'Default',     value: 'true' },
  { label: 'Non-default', value: 'false' },
];

// ─── Orders ───────────────────────────────────────────────────────────────────
// Detailed order constants (status lists, transitions, color maps, helpers)
// live in src/utils/orderUtils.js and are re-exported here for convenience.
export {
  ORDER_STATUS_LIST,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LIST,
  PAYMENT_STATUS_COLORS,
  CANCELLABLE_STATUSES,
  PIPELINE_STEPS,
} from '@/utils/orderUtils';

// ─── Carts ────────────────────────────────────────────────────────────────────
// Cart status constants and color maps live in src/utils/cartUtils.js.
export {
  CART_STATUS_LIST,
  CART_STATUS_COLORS,
} from '@/utils/cartUtils';

// ─── Search / UI Behaviour ────────────────────────────────────────────────────

/** Debounce delay (ms) applied to search inputs across all list pages */
export const SEARCH_DEBOUNCE_MS = 400;
