'use client';

// ----------------------------------------------------------------------
// UnitInput — 숫자 입력 + 끝 단위(매·원) — designer `.d12-unit`. 숫자 키패드(inputMode numeric).
// ----------------------------------------------------------------------
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { Typo } from '@/src/components/typo';

interface UnitInputProps {
  id: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  error?: boolean;
  ariaLabel?: string;
}

export function UnitInput({
  id,
  value,
  unit,
  onChange,
  error = false,
  ariaLabel,
}: UnitInputProps) {
  return (
    <TextField
      id={id}
      value={value}
      error={error}
      onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ''))}
      fullWidth
      slotProps={{
        htmlInput: { inputMode: 'numeric', 'aria-label': ariaLabel },
        input: {
          endAdornment: (
            <InputAdornment position='end'>
              <Typo.Badge.Regular color='text.secondary'>
                {unit}
              </Typo.Badge.Regular>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
