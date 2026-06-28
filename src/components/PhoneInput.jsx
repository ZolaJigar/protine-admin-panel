'use client';

/**
 * PhoneInput — country code picker + phone number input using only MUI.
 * No react-phone-input-2. Works correctly inside MUI Dialogs/Modals.
 *
 * Props:
 *   value        string   — phone number digits only (no dial code), e.g. "9876543210"
 *   dialCode     string   — current dial code, e.g. "91"
 *   onChange     (phoneNumber, dialCode, countryCode) => void
 *   label        string
 *   error        string
 *   disabled     bool
 *   required     bool
 *   size         "small" | "medium"
 */

import { useState, useMemo } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import {
  Box, Typography, TextField, MenuItem,
  Select, InputAdornment, ListSubheader, InputBase,
} from '@mui/material';
import { Search } from '@mui/icons-material';

// ─── Country data (common countries first, then rest) ─────────────────────────
const COUNTRIES = [
  { code: 'IN', name: 'India',          dial: '91'  },
  { code: 'US', name: 'United States',  dial: '1'   },
  { code: 'GB', name: 'United Kingdom', dial: '44'  },
  { code: 'AE', name: 'UAE',            dial: '971' },
  { code: 'AU', name: 'Australia',      dial: '61'  },
  { code: 'CA', name: 'Canada',         dial: '1'   },
  { code: 'SG', name: 'Singapore',      dial: '65'  },
  { code: 'NZ', name: 'New Zealand',    dial: '64'  },
  { code: 'AF', name: 'Afghanistan',    dial: '93'  },
  { code: 'AL', name: 'Albania',        dial: '355' },
  { code: 'DZ', name: 'Algeria',        dial: '213' },
  { code: 'AR', name: 'Argentina',      dial: '54'  },
  { code: 'AT', name: 'Austria',        dial: '43'  },
  { code: 'BD', name: 'Bangladesh',     dial: '880' },
  { code: 'BE', name: 'Belgium',        dial: '32'  },
  { code: 'BR', name: 'Brazil',         dial: '55'  },
  { code: 'BG', name: 'Bulgaria',       dial: '359' },
  { code: 'KH', name: 'Cambodia',       dial: '855' },
  { code: 'CN', name: 'China',          dial: '86'  },
  { code: 'CO', name: 'Colombia',       dial: '57'  },
  { code: 'HR', name: 'Croatia',        dial: '385' },
  { code: 'CZ', name: 'Czech Republic', dial: '420' },
  { code: 'DK', name: 'Denmark',        dial: '45'  },
  { code: 'EG', name: 'Egypt',          dial: '20'  },
  { code: 'FI', name: 'Finland',        dial: '358' },
  { code: 'FR', name: 'France',         dial: '33'  },
  { code: 'DE', name: 'Germany',        dial: '49'  },
  { code: 'GH', name: 'Ghana',          dial: '233' },
  { code: 'GR', name: 'Greece',         dial: '30'  },
  { code: 'HK', name: 'Hong Kong',      dial: '852' },
  { code: 'HU', name: 'Hungary',        dial: '36'  },
  { code: 'ID', name: 'Indonesia',      dial: '62'  },
  { code: 'IR', name: 'Iran',           dial: '98'  },
  { code: 'IQ', name: 'Iraq',           dial: '964' },
  { code: 'IE', name: 'Ireland',        dial: '353' },
  { code: 'IL', name: 'Israel',         dial: '972' },
  { code: 'IT', name: 'Italy',          dial: '39'  },
  { code: 'JP', name: 'Japan',          dial: '81'  },
  { code: 'JO', name: 'Jordan',         dial: '962' },
  { code: 'KZ', name: 'Kazakhstan',     dial: '7'   },
  { code: 'KE', name: 'Kenya',          dial: '254' },
  { code: 'KW', name: 'Kuwait',         dial: '965' },
  { code: 'LB', name: 'Lebanon',        dial: '961' },
  { code: 'MY', name: 'Malaysia',       dial: '60'  },
  { code: 'MX', name: 'Mexico',         dial: '52'  },
  { code: 'MA', name: 'Morocco',        dial: '212' },
  { code: 'MM', name: 'Myanmar',        dial: '95'  },
  { code: 'NP', name: 'Nepal',          dial: '977' },
  { code: 'NG', name: 'Nigeria',        dial: '234' },
  { code: 'NO', name: 'Norway',         dial: '47'  },
  { code: 'OM', name: 'Oman',           dial: '968' },
  { code: 'PK', name: 'Pakistan',       dial: '92'  },
  { code: 'PH', name: 'Philippines',    dial: '63'  },
  { code: 'PL', name: 'Poland',         dial: '48'  },
  { code: 'PT', name: 'Portugal',       dial: '351' },
  { code: 'QA', name: 'Qatar',          dial: '974' },
  { code: 'RO', name: 'Romania',        dial: '40'  },
  { code: 'RU', name: 'Russia',         dial: '7'   },
  { code: 'SA', name: 'Saudi Arabia',   dial: '966' },
  { code: 'ZA', name: 'South Africa',   dial: '27'  },
  { code: 'KR', name: 'South Korea',    dial: '82'  },
  { code: 'ES', name: 'Spain',          dial: '34'  },
  { code: 'LK', name: 'Sri Lanka',      dial: '94'  },
  { code: 'SE', name: 'Sweden',         dial: '46'  },
  { code: 'CH', name: 'Switzerland',    dial: '41'  },
  { code: 'TW', name: 'Taiwan',         dial: '886' },
  { code: 'TH', name: 'Thailand',       dial: '66'  },
  { code: 'TR', name: 'Turkey',         dial: '90'  },
  { code: 'UA', name: 'Ukraine',        dial: '380' },
  { code: 'UZ', name: 'Uzbekistan',     dial: '998' },
  { code: 'VN', name: 'Vietnam',        dial: '84'  },
  { code: 'YE', name: 'Yemen',          dial: '967' },
  { code: 'ZW', name: 'Zimbabwe',       dial: '263' },
];

function Flag({ code }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()}`}
      style={{ width: 20, height: 15, borderRadius: 2, flexShrink: 0, display: 'inline-block' }}
    />
  );
}

export default function PhoneInput({
  value       = '',
  dialCode    = '91',
  onChange,
  label       = 'Phone',
  error       = '',
  disabled    = false,
  required    = false,
  size        = 'medium',
}) {
  const [search, setSearch] = useState('');

  const selectedCountry = COUNTRIES.find((c) => c.dial === dialCode) ?? COUNTRIES[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
    );
  }, [search]);

  const height   = size === 'small' ? 40 : 52;
  const fontSize = size === 'small' ? 13 : 15;

  const handleCountryChange = (e) => {
    const newDial = e.target.value;
    const country = COUNTRIES.find((c) => c.dial === newDial);
    onChange?.(value, newDial, country?.code?.toLowerCase() ?? '');
    setSearch('');
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange?.(digits, dialCode, selectedCountry.code.toLowerCase());
  };

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="body2" sx={{
          display: 'block', mb: 0.5, fontSize: 12, fontWeight: 500,
          color: error ? 'error.main' : 'text.secondary',
        }}>
          {label}{required && ' *'}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 0 }}>
        {/* Country code selector */}
        <Select
          value={dialCode}
          onChange={handleCountryChange}
          disabled={disabled}
          size={size}
          MenuProps={{
            // render inside the modal's stacking context
            disablePortal: false,
            slotProps: { paper: { sx: { maxHeight: 280, mt: 0.5 } } },
          }}
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Flag code={selectedCountry.code} />
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>+{dialCode}</Typography>
            </Box>
          )}
          sx={{
            minWidth: 100,
            height,
            borderRadius: '8px 0 0 8px',
            bgcolor: '#fafafa',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? '#d32f2f' : '#e0e0e0',
              borderRight: 'none',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: error ? '#d32f2f' : '#bdbdbd', borderRight: 'none' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1B4332', borderRight: 'none' },
          }}
        >
          {/* Sticky search inside dropdown */}
          <ListSubheader sx={{ py: 0.5, px: 1, bgcolor: '#fff', lineHeight: 1 }}>
            <InputBase
              autoFocus
              size="small"
              placeholder="Search country…"
              value={search}
              onChange={(e) => { e.stopPropagation(); setSearch(e.target.value); }}
              onKeyDown={(e) => e.stopPropagation()}
              startAdornment={<InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>}
              sx={{
                width: '100%', fontSize: 13, px: 1, py: 0.5,
                border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9',
              }}
            />
          </ListSubheader>

          {filtered.map((c) => (
            <MenuItem key={`${c.code}-${c.dial}`} value={c.dial} sx={{ gap: 1, fontSize: 13, py: 0.75 }}>
              <Flag code={c.code} />
              <Typography sx={{ fontSize: 13 }}>{c.name}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', ml: 'auto' }}>+{c.dial}</Typography>
            </MenuItem>
          ))}
        </Select>

        {/* Phone number input */}
        <TextField
          value={value}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder="Phone number"
          size={size}
          slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 15 } }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height,
              fontSize,
              borderRadius: '0 8px 8px 0',
              '& fieldset': { borderColor: error ? '#d32f2f' : '#e0e0e0' },
              '&:hover fieldset': { borderColor: error ? '#d32f2f' : '#bdbdbd' },
              '&.Mui-focused fieldset': { borderColor: '#1B4332' },
            },
          }}
        />
      </Box>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
