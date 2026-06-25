'use client';

import { TextField } from '@mui/material';

/**
 * Textarea — multiline TextInput wrapper.
 *
 * Props:
 *   label       string
 *   value       string
 *   onChange    (e) => void
 *   onBlur      () => void
 *   error       string | null
 *   placeholder string
 *   rows        number   — default 4
 *   required    bool
 *   disabled    bool
 *   readOnly    bool
 *   size        'small' | 'medium'
 *   fullWidth   bool     — default true
 *   sx          object
 *   ...rest     passed to TextField
 *
 * Usage:
 *   <Textarea
 *     label="Description"
 *     value={description}
 *     onChange={(e) => setDescription(e.target.value)}
 *     rows={4}
 *     error={errors?.description}
 *   />
 */
export default function Textarea({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'medium',
  fullWidth = true,
  sx = {},
  ...rest
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      multiline
      rows={rows}
      size={size}
      fullWidth={fullWidth}
      error={!!error}
      helperText={error || ''}
      slotProps={{
        input: { readOnly },
      }}
      sx={sx}
      {...rest}
    />
  );
}
