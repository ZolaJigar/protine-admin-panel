'use client';

import { TextField } from '@mui/material';

/**
 * TextInput — wraps MUI TextField with project theme defaults.
 *
 * Props:
 *   label       string
 *   value       string
 *   onChange    (e) => void
 *   onBlur      () => void
 *   error       string | null      — shows helper text + red border
 *   placeholder string
 *   required    bool
 *   disabled    bool
 *   readOnly    bool
 *   type        string             — 'text' | 'password' | 'email' | 'number' etc.
 *   size        'small' | 'medium'
 *   fullWidth   bool               — default true
 *   sx          object             — extra MUI sx overrides
 *   ...rest     passed to TextField
 *
 * Usage:
 *   <TextInput
 *     label="Subject *"
 *     value={subject}
 *     onChange={(e) => setSubject(e.target.value)}
 *     onBlur={() => handleOnBlur(subject, 'subject')}
 *     error={errors?.subject}
 *   />
 */
export default function TextInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  type = 'text',
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
      type={type}
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
