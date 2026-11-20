'use client';

// ----------------------------------------------------------------------
// CustomLineFields — '직접 입력' 줄: 표시 이름(기본 "직접 입력") · 매수 · 금액(0 허용) — designer dialog-manual-direct.
// ----------------------------------------------------------------------
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { UnitInput } from '@/src/components/manual-reservation-dialog/unit-input';
import type { ReservationLinesErrors } from '@/src/components/manual-reservation-dialog/validate-manual-reservation';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface CustomLineFieldsProps {
  label: string;
  quantity: string;
  amount: string;
  errors: Pick<
    ReservationLinesErrors,
    'customLabel' | 'customQuantity' | 'customAmount'
  >;
  onChange: (
    patch: Partial<{
      customLabel: string;
      customQuantity: string;
      customAmount: string;
    }>
  ) => void;
}

export function CustomLineFields({
  label,
  quantity,
  amount,
  errors,
  onChange,
}: CustomLineFieldsProps) {
  const labelId = useId();
  const qtyId = useId();
  const amountId = useId();
  return (
    <div className='flex flex-col gap-4'>
      <FormField
        label={MSG_D12.MANUAL_CUSTOM_LABEL}
        htmlFor={labelId}
        helper={MSG_D12.MANUAL_CUSTOM_LABEL_HELP}
        error={errors.customLabel}
      >
        <TextField
          id={labelId}
          value={label}
          placeholder={MSG_D12.MANUAL_CUSTOM_LABEL_PH}
          error={Boolean(errors.customLabel)}
          onChange={(event) => onChange({ customLabel: event.target.value })}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 30 } }}
        />
      </FormField>
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          label={MSG_D12.MANUAL_CUSTOM_QTY}
          htmlFor={qtyId}
          required
          error={errors.customQuantity}
        >
          <UnitInput
            id={qtyId}
            value={quantity}
            unit={MSG_BOOKING.TICKET_UNIT}
            error={Boolean(errors.customQuantity)}
            onChange={(value) => onChange({ customQuantity: value })}
          />
        </FormField>
        <FormField
          label={MSG_D12.MANUAL_CUSTOM_AMOUNT}
          htmlFor={amountId}
          required
          error={errors.customAmount}
        >
          <UnitInput
            id={amountId}
            value={amount}
            unit={MSG_BOOKING.WON}
            error={Boolean(errors.customAmount)}
            onChange={(value) => onChange({ customAmount: value })}
          />
        </FormField>
      </div>
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_D12.MANUAL_CUSTOM_AMOUNT_HELP}
      </Typo.Caption.Regular>
    </div>
  );
}
