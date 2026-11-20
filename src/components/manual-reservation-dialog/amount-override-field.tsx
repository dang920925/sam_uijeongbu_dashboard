'use client';

// ----------------------------------------------------------------------
// AmountOverrideField — "금액 직접 정하기" 체크 + 금액(0 허용) — develop §11.10 amountOverride.
// ----------------------------------------------------------------------
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useId } from 'react';

import { UnitInput } from '@/src/components/manual-reservation-dialog/unit-input';
import { Typo } from '@/src/components/typo';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface AmountOverrideFieldProps {
  checked: boolean;
  value: string;
  error: string | null;
  onToggle: (checked: boolean) => void;
  onChange: (value: string) => void;
}

export function AmountOverrideField({
  checked,
  value,
  error,
  onToggle,
  onChange,
}: AmountOverrideFieldProps) {
  const inputId = useId();
  return (
    <div className='flex flex-col gap-2'>
      <FormControlLabel
        sx={{ m: 0, minHeight: 44, gap: 2 }}
        control={
          <Checkbox
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
            sx={{ p: 0 }}
          />
        }
        label={<Typo.Body.Regular>{MSG_D12.MANUAL_OVERRIDE}</Typo.Body.Regular>}
      />
      {checked ? (
        <div className='flex flex-col gap-1'>
          <UnitInput
            id={inputId}
            value={value}
            unit={MSG_BOOKING.WON}
            error={Boolean(error)}
            ariaLabel={MSG_D12.MANUAL_OVERRIDE_ARIA}
            onChange={onChange}
          />
          {error ? (
            <Typo.Caption.Regular color='error.main' role='alert'>
              {error}
            </Typo.Caption.Regular>
          ) : (
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D12.MANUAL_OVERRIDE_HELP}
            </Typo.Caption.Regular>
          )}
        </div>
      ) : null}
    </div>
  );
}
