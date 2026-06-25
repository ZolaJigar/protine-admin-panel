'use client';

import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
} from '@mui/material';

/**
 * Select — wraps MUI Select with project theme defaults.
 *
 * Props:
 *   label       string
 *   value       string | number
 *   onChange    (e) => void
 *   onBlur      () => void
 *   options     Array<{ label: string, value: string | number }>
 *   placeholder string             — shown as a disabled "none" option
 *   error       string | null
 *   required    bool
 *   disabled    bool
 *   size        'small' | 'medium'
 *   fullWidth   bool               — default false; set true inside forms so it fills its flex column
 *   sx          object
 *   ...rest     passed to MUI Select
 *
 * Usage:
 *   <Select
 *     label="Category *"
 *     value={categoryId}
 *     onChange={(e) => setCategoryId(e.target.value)}
 *     options={categories.map((c) => ({ label: c.name, value: c.id }))}
 *     error={errors?.categoryId}
 *   />
 */
export default function Select({
  label,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder,
  error,
  required = false,
  disabled = false,
  size = 'medium',
  fullWidth = false,
  sx = {},
  ...rest
}) {
  const labelId = `select-label-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <FormControl fullWidth={fullWidth} size={size} error={!!error} disabled={disabled} sx={sx}>
      <InputLabel id={labelId} required={required}>
        {label}
      </InputLabel>
      <MuiSelect
        labelId={labelId}
        label={label}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
