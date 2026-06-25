'use client';

import { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem,
  FormHelperText, CircularProgress, Box,
} from '@mui/material';
import { apiPost } from '@/lib/api';

/**
 * StateSelect — reusable controlled dropdown for state selection.
 * Filters states by countryId. Used by the Cities form (and anywhere else).
 *
 * Props:
 *   value       — selected state id (number | '')
 *   onChange    — (id) => void
 *   countryId   — filter states to this country (number | '' | null)
 *   label       — label string (default "State")
 *   placeholder — placeholder text (default "Select state")
 *   disabled    — boolean
 *   error       — boolean
 *   helperText  — string shown below the select
 *   size        — 'small' | 'medium' (default 'medium')
 */
export default function StateSelect({
  value       = '',
  onChange,
  countryId   = null,
  label       = 'State',
  placeholder = 'Select state',
  disabled    = false,
  error       = false,
  helperText  = '',
  size        = 'medium',
}) {
  const [states, setStates]         = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    // clear and show placeholder when no country selected
    if (!countryId) {
      setStates([]);
      setFetchError('');
      // clear parent value when country changes
      onChange && onChange('');
      return;
    }

    setIsLoading(true);
    setFetchError('');
    // clear stale value when country changes
    onChange && onChange('');

    apiPost('/states/list', { page: 1, limit: 100, search: '', country_id: countryId })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setStates(list);
      })
      .catch((err) => {
        setFetchError(typeof err === 'string' ? err : 'Failed to load states.');
        setStates([]);
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId]);

  const noCountry         = !countryId;
  const displayHelperText = fetchError || helperText;
  const effectiveLabel    = isLoading ? 'Loading…' : label;

  return (
    <FormControl
      fullWidth size={size}
      error={error || !!fetchError}
      disabled={disabled || isLoading || noCountry}
    >
      <InputLabel>{effectiveLabel}</InputLabel>
      <Select
        value={value}
        label={effectiveLabel}
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
          <em>{noCountry ? 'Select a country first' : placeholder}</em>
        </MenuItem>
        {states.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </Select>
      {displayHelperText && <FormHelperText>{displayHelperText}</FormHelperText>}
    </FormControl>
  );
}
