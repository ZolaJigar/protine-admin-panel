'use client';

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox as MuiCheckbox,
} from '@mui/material';

/**
 * Checkbox — wraps MUI Checkbox with project theme defaults.
 *
 * Props:
 *   label     string
 *   checked   bool
 *   onChange  (e) => void
 *   error     string | null
 *   disabled  bool
 *   size      'small' | 'medium'
 *   sx        object
 *   ...rest   passed to MuiCheckbox
 *
 * Usage:
 *   <Checkbox
 *     label="I agree to the terms"
 *     checked={agreed}
 *     onChange={(e) => setAgreed(e.target.checked)}
 *     error={errors?.agreed}
 *   />
 */
export default function Checkbox({
  label,
  checked,
  onChange,
  error,
  disabled = false,
  size = 'medium',
  sx = {},
  ...rest
}) {
  return (
    <FormControl error={!!error}>
      <FormControlLabel
        label={label}
        control={
          <MuiCheckbox
            checked={!!checked}
            onChange={onChange}
            disabled={disabled}
            size={size}
            sx={{
              color: '#1B4332',
              '&.Mui-checked': { color: '#1B4332' },
              ...sx,
            }}
            {...rest}
          />
        }
      />
      {error && <FormHelperText sx={{ mt: -0.5, ml: 0 }}>{error}</FormHelperText>}
    </FormControl>
  );
}
