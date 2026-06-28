/**
 * utils/functions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central utility library for the admin panel.
 *
 * Sections (Ctrl+F the section header to jump):
 *   1. DATE FORMATTING
 *   2. DATE / STRING CONVERSION
 *   3. TIME FORMATTING
 *   4. DATE PREDICATES & CALCULATIONS
 *   5. NUMBER & CURRENCY FORMATTING
 *   6. STRING HELPERS
 *   7. VALIDATION
 *   8. CLIPBOARD & FILE HELPERS
 *   9. MISCELLANEOUS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── 1. DATE FORMATTING ───────────────────────────────────────────────────────
// All formatters accept any value accepted by `new Date()` unless noted.

/**
 * INPUT : [ new Date('2024-04-16T18:30:00.000Z') ]   (array)
 * OUTPUT: '2024-04-17'
 */
export const dateFormat = (date) => {
  const d = Array.isArray(date) ? new Date(date[0]) : new Date(date);
  return d.toISOString().slice(0, 10);
};

/**
 * INPUT : new Date('2024-05-14T18:30:00.000Z')
 * OUTPUT: '2024-05-15'
 */
export const dateFormat2 = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

/**
 * INPUT : '20-04-2024'  (DD-MM-YYYY)
 * OUTPUT: '20/04/2024'
 */
export const dateFormat3 = (date) => {
  const [dd, mm, yyyy] = date.split('-');
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * INPUT : '2024-04-19T11:07:43.000Z'  (ISO string)
 * OUTPUT: '19/04/2024'
 */
export const dateFormat4 = (date) => {
  const d = new Date(date);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * INPUT : '23-04-2024'
 * OUTPUT: '23/04/2024 00:00'   (DD/MM/YYYY HH:mm)
 */
export const dateFormat5 = (date) => {
  const [dd, mm, yyyy] = date.split('-');
  return `${dd}/${mm}/${yyyy} 00:00`;
};

/**
 * INPUT : '2024-06-11'  (YYYY-MM-DD)
 * OUTPUT: '11/06/2024'
 */
export const dateFormat6 = (date) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * INPUT : '19/04/2024'  (DD/MM/YYYY)
 * OUTPUT: '2024-04-19'  (YYYY-MM-DD)
 */
export const dateFormat7 = (date) => {
  const [dd, mm, yyyy] = date.split('/');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * INPUT : new Date('2024-07-04T00:00:00.000Z')
 * OUTPUT: '04 Jul 2024, Thursday'
 */
export const dateFormat8 = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', weekday: 'long',
  }).replace(',', ' ').replace(/(\d{2}) (\w{3}) (\w+) (\d{4})/, '$1 $2 $4, $3');
};

/**
 * INPUT : new Date('2024-01-25T18:30:00.000Z')
 * OUTPUT: '26th Jan 2024'  (ordinal day)
 */
export const dateFormat9 = (date) => {
  const d   = new Date(date);
  const day = d.getDate();
  const ord = ['th','st','nd','rd'][((day % 100 - 20) % 10 < 4 && (day % 100 > 20 || day % 100 < 4)) ? day % 10 : 0] || 'th';
  const mon = d.toLocaleDateString('en-IN', { month: 'short' });
  return `${day}${ord} ${mon} ${d.getFullYear()}`;
};

/**
 * INPUT : Fri Aug 30 2024 ...
 * OUTPUT: '2024-08-30'
 */
export const dateFormat10 = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

/**
 * INPUT : '2024-06-11'
 * OUTPUT: '04th Jul'  (ordinal day + month name, no year)
 */
export const dateFormat11 = (date) => {
  const d   = new Date(date);
  const day = d.getDate();
  const ord = ['th','st','nd','rd'][((day % 100 - 20) % 10 < 4 && (day % 100 > 20 || day % 100 < 4)) ? day % 10 : 0] || 'th';
  const mon = d.toLocaleDateString('en-IN', { month: 'long' });
  return `${day}${ord} ${mon}`;
};

/**
 * INPUT : '2025-04-25'
 * OUTPUT: '26 Jan 2024'
 * (day: '2-digit' — zero-pads single-digit days, e.g. '02 Jan 2024')
 */
export const dateFormat12 = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * INPUT : '2025-04-25T12:19:00Z'
 * OUTPUT: '23 Apr, 12:19 PM'
 */
export const dateFormat13 = (date) => {
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
};

/**
 * INPUT : '20-04-2024'  (DD-MM-YYYY  same as dateFormat3 alias)
 * OUTPUT: '20/04/2024'
 */
export const dateFormat14 = dateFormat3;

// ─── 2. DATE / STRING CONVERSION ─────────────────────────────────────────────

/**
 * Parse 'DD-MM-YYYY' → native Date object.
 * INPUT : '23-04-2024'
 * OUTPUT: Date object
 */
export const stringToDate = (date) => {
  const [dd, mm, yyyy] = date.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`);
};

/**
 * Parse 'YYYY-MM-DD' → native Date object.
 * INPUT : '2024-04-23'
 * OUTPUT: Date object
 */
export const stringToDate2 = (date) => {
  return new Date(date);
};

/**
 * Parse 'DD/MM/YYYY' → 'YYYY-MM-DD' string.
 * INPUT : '23/04/2024'
 * OUTPUT: '2024-04-23'
 */
export const stringToDate3 = (date) => {
  const [dd, mm, yyyy] = date.split('/');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Parse ISO/datetime string → Date object (kept for compatibility).
 * INPUT : '2024-04-26T18:13:00.000Z'
 * OUTPUT: Date object
 */
export const stringToDateTime = (date) => {
  return new Date(date);
};

// ─── 3. TIME FORMATTING ───────────────────────────────────────────────────────

/**
 * Format a datetime ISO string as 'DD/MM/YYYY hh:mm AM/PM'.
 * INPUT : '2024-04-26T18:13:00.000Z'
 * OUTPUT: '26/04/2024 06:13 PM'
 */
export const dateTimeFormat = (date) => {
  const d = new Date(date);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${dd}/${mm}/${yyyy} ${time}`;
};

/**
 * Format [Date] array → 'YYYY-MM-DD HH:mm'.
 * INPUT : [ new Date('2024-06-12T13:30:00.000Z') ]
 * OUTPUT: '2024-06-12 19:00'
 */
export const dateTimeFormat2 = (date) => {
  const d    = Array.isArray(date) ? new Date(date[0]) : new Date(date);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

/**
 * Format datetime string → 'DD/MM/YYYY hh:mmAM/PM'.
 * INPUT : '2024-12-10 10:38:04'
 * OUTPUT: '10/12/2024 10:38AM'
 */
export const dateTimeFormat3 = (date) => {
  const d = new Date(date);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' ', '');
  return `${dd}/${mm}/${yyyy} ${time}`;
};

/**
 * Convert total seconds → 'HH:MM:SS' (hours omitted when 0).
 * INPUT : 3754
 * OUTPUT: '01:02:34'
 */
export const formatTime = (seconds) => {
  const hrs  = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format 'HH:MM:SS' duration string → '1h 3m 54s'.
 * INPUT : '01:03:54'
 * OUTPUT: '1h 3m 54s'
 */
export const formatTime2 = (time) => {
  const [hh = '0', mm = '0', ss = '0'] = time.split(':');
  return `${parseInt(hh)}h ${parseInt(mm)}m ${parseInt(ss)}s`;
};

/**
 * Format 24-hour 'HH:mm:ss' → '02:03 PM'.
 * INPUT : '14:03:54'
 * OUTPUT: '02:03 PM'
 */
export const formatTime3 = (time) => {
  const [hh, mm] = time.split(':').map(Number);
  const period   = hh >= 12 ? 'PM' : 'AM';
  const hour12   = ((hh % 12) || 12);
  return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`;
};

/**
 * Calculate human-readable difference between two HH:mm:ss strings.
 * INPUT : '09:00:00', '10:30:00'
 * OUTPUT: '1h 30m'
 */
export const calculateTimeDifference = (startTime, endTime) => {
  const toSecs = (t) => t.split(':').reduce((acc, v, i) => acc + Number(v) * [3600, 60, 1][i], 0);
  const diff   = toSecs(endTime) - toSecs(startTime);
  const hours  = Math.floor(diff / 3600);
  const mins   = Math.floor((diff % 3600) / 60);
  return `${hours}h ${mins}m`;
};

// ─── 4. DATE PREDICATES & CALCULATIONS ───────────────────────────────────────

/**
 * Returns true when date1 > date2 (both are single-element arrays).
 * INPUT : [new Date('2024-04-28')], [new Date('2024-04-27')]
 * OUTPUT: true
 */
export const isPastDate = (date1, date2) => {
  return date1[0] > date2[0];
};

/**
 * Returns true when the given date falls on a Monday.
 */
export const isMonday = (date) => {
  return new Date(date).getDay() === 1;
};

/**
 * Returns the weekday name for a date.
 * OUTPUT: 'Thursday'
 */
export const getDayFromDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'long' });
};

/**
 * Returns the short month name for a date.
 * OUTPUT: 'Jul'
 */
export const getMonthFromDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', { month: 'short' });
};

/**
 * Returns the 4-digit year string for a date.
 * OUTPUT: '2024'
 */
export const getYearFromDate = (date) => {
  return String(new Date(date).getFullYear());
};

/**
 * Returns the current Indian financial year string (Apr–Mar).
 * OUTPUT: '2025 - 2026'
 */
export const getCurrentFinancialYear = (date = new Date()) => {
  const d     = new Date(date);
  const year  = d.getFullYear();
  const month = d.getMonth(); // 0-indexed, so 3 = April
  return month >= 3
    ? `${year} - ${year + 1}`
    : `${year - 1} - ${year}`;
};

/**
 * Returns the last day of the month for a given date as 'YYYY-MM-DD'.
 * INPUT : new Date('2024-09-01')
 * OUTPUT: '2024-09-30'
 */
export const getMonthEndDate = (date) => {
  const d = new Date(date);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
};

/**
 * Returns inclusive day count between two dates.
 * INPUT : new Date('2024-07-15'), new Date('2024-07-17')
 * OUTPUT: 3
 */
export const calculateDaysDifference = (startDate, endDate) => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((new Date(endDate) - new Date(startDate)) / MS_PER_DAY) + 1;
};

// ─── 5. NUMBER & CURRENCY FORMATTING ─────────────────────────────────────────

/**
 * Format a number in Indian locale (e.g. 1,23,456.78).
 * Returns the original value unchanged if falsy.
 */
export const indianAmountFormat = (value) => {
  if (!value && value !== 0) return value;
  return parseFloat(value).toLocaleString('en-IN');
};

/**
 * Compact number formatter: K / M / B.
 * INPUT : 1234567
 * OUTPUT: '1.2M'
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return String(num);
};

/**
 * Format bytes into a human-readable size string.
 * INPUT : 1536
 * OUTPUT: '1.5 KB'
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Round a value to the nearest integer.
 */
export const roundOff = (value) => Math.round(value);

// ─── 6. STRING HELPERS ────────────────────────────────────────────────────────

/**
 * Convert a string to Title Case.
 * INPUT : 'hello world'
 * OUTPUT: 'Hello World'
 */
export const titleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Strip HTML tags and decode HTML entities, returning plain text.
 */
export const htmlToPlainText = (html) => {
  let text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '  *  ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html').body.textContent;
};

/**
 * Build a React-select-compatible option object.
 * OUTPUT: { id, value, label }
 */
export const prepareSelectOption = (id, name) => ({
  id,
  value: id,
  label: name,
});

/**
 * Deep equality check using JSON serialisation.
 */
export const isEqualObjects = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Check whether a string is valid JSON.
 */
export const isValidJSON = (str) => {
  try {
    return str ? Boolean(JSON.parse(str)) : false;
  } catch {
    return false;
  }
};

// ─── 7. VALIDATION ────────────────────────────────────────────────────────────

/** Returns true if the string is a valid URL. */
export const validateUrl = (url) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$',
    'i',
  );
  return pattern.test(url);
};

/** Returns true if the string is a valid email address. */
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/** Returns true if the string is a valid Indian PAN card number. */
export const validatePanCard = (panCard) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard);
};

/** Returns true if the string matches Indian passport format (A1234567). */
export const validatePassport = (passport) => {
  return /^[A-Z]{1}[0-9]{7}$/.test(passport);
};

/** Returns true if the string matches the PF account number pattern. */
export const validatePF = (pf) => {
  return /^[A-Z]{2}[A-Z]{3}\d{7}\d{3}\d{7}$/.test(pf);
};

/** Returns true if the phone number is NOT 10 digits (i.e. invalid). */
export const validatePhone = (phone) => phone.length !== 10;

/** Returns true if the pin code is NOT 6 digits (i.e. invalid). */
export const validatePinCode = (pin) => pin.length !== 6;

// ─── 8. CLIPBOARD & FILE HELPERS ─────────────────────────────────────────────

/**
 * Copy text to clipboard and fire optional callbacks.
 * Pass onSuccess / onError to hook into your toast system at the call-site.
 *
 * Usage (with react-toastify):
 *   copyToClipboard(text, () => toast.success('Copied!'), () => toast.error('Failed'));
 */
export const copyToClipboard = (text, onSuccess, onError) => {
  navigator.clipboard
    ?.writeText(text)
    .then(() => (onSuccess ? onSuccess() : console.info('Copied to clipboard')))
    .catch(() => (onError ? onError() : console.error('Failed to copy text')));
};

/**
 * Returns the work-mode display label for a given code.
 * INPUT : 'WFH'
 * OUTPUT: 'Work from Home'
 */
export const getEmpWorkModeType = (type) => {
  const map = {
    WFH:     'Work from Home',
    COMPOFF: 'Compensatory Off',
    ODD:     'Outdoor Duty',
  };
  return map[type] ?? 'Unknown';
};

/**
 * Validate an image File against an allowed MIME types list and a max size.
 *
 * @param {File}     file          - The file to validate.
 * @param {string[]} acceptedTypes - Array of allowed MIME types.
 * @param {number}   [maxSize]     - Max bytes (default 5 MB).
 * @returns {string|null} Error message string, or null if valid.
 *
 * Usage:
 *   import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/constants/values';
 *   const err = validateImageFile(file, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE);
 *   if (err) toast.error(err);
 */
export const validateImageFile = (file, acceptedTypes, maxSize = 5 * 1024 * 1024) => {
  if (!acceptedTypes.includes(file.type)) {
    return `File type not allowed. Accepted: ${acceptedTypes.map((t) => t.split('/')[1]).join(', ')}.`;
  }
  if (file.size > maxSize) {
    return `Image must be under ${Math.round(maxSize / (1024 * 1024))} MB.`;
  }
  return null;
};

// ─── 9. MISCELLANEOUS ────────────────────────────────────────────────────────

/**
 * Format a sales-order attachment for display.
 * Returns an <img> for images and an <iframe> for other file types.
 */
export const salesOrderAttachmentType = (type, attachment) => {
  if (type === 'image' && attachment) {
    return <img src={attachment} alt="Attachment" className="ml-auto mr-auto" />;
  }
  return (
    <iframe
      src={attachment}
      width="800"
      height="600"
      title="attachment"
      className="ml-auto mr-auto"
    />
  );
};

// ─── 10. DISPLAY HELPERS (used in tables / cards) ────────────────────────────

/**
 * Extract up to 2 uppercase initials from a full name.
 * INPUT : 'John Doe'
 * OUTPUT: 'JD'
 */
export const getInitials = (name = '') => {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
};

/**
 * Truncate a string to `n` characters, appending '…' when trimmed.
 * Returns '—' for empty/null values.
 *
 * @param {string} str
 * @param {number} [n=60]
 */
export const truncate = (str, n = 60) => {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
};

/**
 * Convert a display name to a URL-safe slug.
 * INPUT : 'Hello World!'
 * OUTPUT: 'hello-world'
 */
export const nameToSlug = (name) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

/**
 * Format a price value as '₹1299.00' (plain fixed-2 decimal).
 * Returns '—' for null/undefined/empty.
 */
export const formatPrice = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  return '₹' + Number(val).toFixed(2);
};

/**
 * Format a price value using Indian locale (₹1,23,456.00).
 * Returns '—' for null/undefined/empty.
 */
export const formatPriceIndian = (val) => {
  if (val == null || val === '') return '—';
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

/**
 * Return a human-readable "time ago" string for an ISO timestamp.
 * INPUT : '2024-06-11T10:00:00.000Z'  (1 hour ago)
 * OUTPUT: '1h ago'
 */
export const timeAgo = (iso) => {
  if (!iso) return '';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
};

/**
 * Format an ISO datetime string as localised date + time.
 * INPUT : '2024-04-26T18:13:00.000Z'
 * OUTPUT: '26 Apr 2024, 06:13 pm'  (en-IN locale)
 */
export const dateTimeFormat4 = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
