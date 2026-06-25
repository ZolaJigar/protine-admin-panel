'use client';

import {
  FormControl,
  FormLabel,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';

/**
 * RadioGroup — wraps MUI RadioGroup with project theme defaults.
 *
 * Props:
 *   label     string            — group label shown above the options
 *   value     string | number
 *   onChange  (e) => void
 *   options   Array<{ label: string, value: string | number }>
 *   error     string | null
 *   disabled  bool
 *   row       bool              — render options horizontally, default false
 *   size      'small' | 'medium'
 *   sx        object
 *
 * Usage:
 *   <RadioGroup
 *     label="Gender"
 *     value={gender}
 *     onChange={(e) => setGender(e.target.value)}
 *     options={[
 *       { label: 'Male',   value: 'male' },
 *       { label: 'Female', value: 'female' },
 *     ]}
 *     error={errors?.gender}
 *   />
 */
export default function RadioGroup({
  label,
  value,
  onChange,
  options = [],
  error,
  disabled = false,
  row = false,
  size = 'medium',
  sx = {},
}) {
  return (
    <FormControl error={!!error} disabled={disabled} sx={sx}>
      {label && (
        <FormLabel
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: 14,
            '&.Mui-focused': { color: '#1B4332' },
          }}
        >
          {label}
        </FormLabel>
      )}
      <MuiRadioGroup value={value ?? ''} onChange={onChange} row={row}>
        {options.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            label={opt.label}
            disabled={opt.disabled ?? false}
            control={
              <Radio
                size={size}
                sx={{
                  color: '#1B4332',
                  '&.Mui-checked': { color: '#1B4332' },
                }}
              />
            }
          />
        ))}
      </MuiRadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
