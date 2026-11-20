'use client';

// ----------------------------------------------------------------------
// QuantityStepper — − / 수량 / + (designer SCR-D12 dialog-manual·dialog-items). 버튼 44(터치), 수량은 aria-live.
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface QuantityStepperProps {
  /** 줄 이름(aria "{이름} 1매 더하기") */
  name: string;
  value: number;
  canIncrease: boolean;
  onChange: (value: number) => void;
}

const BUTTON_SX = {
  width: LAYOUT.touch,
  height: LAYOUT.touch,
  border: 1,
  borderColor: 'divider',
  color: 'text.primary',
};

export function QuantityStepper({
  name,
  value,
  canIncrease,
  onChange,
}: QuantityStepperProps) {
  return (
    <div className='flex shrink-0 items-center gap-2'>
      <IconButton
        aria-label={MSG_D12.MANUAL_DECREASE(name)}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        sx={BUTTON_SX}
      >
        <Iconify icon='solar:minus-circle-linear' size='md' />
      </IconButton>
      <output
        aria-live='polite'
        aria-label={MSG_D12.MANUAL_QTY_ARIA(name)}
        className='min-w-8 text-center'
      >
        <Typo.Body.Semibold>{value}</Typo.Body.Semibold>
      </output>
      <IconButton
        aria-label={MSG_D12.MANUAL_INCREASE(name)}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
        sx={BUTTON_SX}
      >
        <Iconify icon='solar:add-circle-linear' size='md' />
      </IconButton>
    </div>
  );
}
