'use client';

// ----------------------------------------------------------------------
// SwitchField — 라벨 + MUI Switch 한 줄(시안 `.d03-switch-row`). 터치 44.
// ----------------------------------------------------------------------
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import { Typo } from '@/src/components/typo';

interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SwitchField({
  label,
  checked,
  onChange,
  disabled = false,
}: SwitchFieldProps) {
  return (
    <FormControlLabel
      labelPlacement='start'
      sx={{ m: 0, minHeight: 44, justifyContent: 'space-between', gap: 3 }}
      control={
        <Switch
          checked={checked}
          disabled={disabled}
          onChange={(_, value) => onChange(value)}
        />
      }
      label={<Typo.Badge.Medium>{label}</Typo.Badge.Medium>}
    />
  );
}
