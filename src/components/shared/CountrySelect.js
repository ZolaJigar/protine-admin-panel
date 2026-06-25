'use client';

import { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem,
  FormHelperText, CircularProgress, Box,
} from '@mui/material';
import { apiPost } from '@/lib/api';

/**
 * CountrySelect — reusable controlled dropdown for country selection.
 * Used by Countries, States, and Cities forms.
 *
 * Props:
 *   value       — selected country id (number | '')
 *   onChange    — (id) => void
 *   label       — label string (default "Country")
 *   placeholder — placeholder text (default "Select country")
 *   disabled    — boolean
 *   error       — boolean
 *   helperText  — string shown below the select
 *   size        — 'small' | 'medium' (default 'medium')
 */
export default function CountrySelect({
  value       = '',
  onChange,
  label       = 'Country',
  placeholder = 'Select country',
  disabled    = false,
  error       = false,
  helperText  = '',
  size        = 'medium',
}) {
  const [countries, setCountries]   = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setFetchError('');
    apiPost('/countries/list', { page: 1, limit: 100, search: '' })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setCountries(list);
      })
      .catch((err) => {
        setFetchError(typeof err === 'string' ? err : 'Failed to load countries.');
        setCountries([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const displayHelperText = fetchError || helperText;

  return (
    <FormControl fullWidth size={size} error={error || !!fetchError} disabled={disabled || isLoading}>
      <InputLabel>{isLoading ? 'Loading…' : label}</InputLabel>
      <Select
        value={value}
        label={isLoading ? 'Loading…' : label}
        onChange={(e) => onChange && onChange(e.target.value)}
        startAdornment={
          isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
              <CircularProgress size={16} />
            </Box>
          ) : null
        }
      >
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {countries.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
      {displayHelperText && <FormHelperText>{displayHelperText}</FormHelperText>}
    </FormControl>
  );
}
