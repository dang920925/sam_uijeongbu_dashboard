'use client';

// ----------------------------------------------------------------------
// 등급 수정 Dialog(designer dialog-items · design §6.1b) — 안내 "같은 등급은 예매 당시 가격을 유지합니다." →
// 등급 stepper(예매 당시/지금 가격) · (있으면) 직접 입력 줄 · 금액 직접 정하기 → 변경 전/후 총액 → 상태 안 바뀜 안내.
// PUT /admin/reservations/{id}/items + version. 서버 RSV_003·009·011·012 문구는 Dialog 안에.
// ----------------------------------------------------------------------
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';

import {
  formatShowSlot,
  formatWon,
  previewLinesAmount,
  toReservationLinesFormInput,
  type Reservation,
  type ReservationLinesFormInput,
} from '@/src/api/reservation-mapper';
import type { ReservationTierOption } from '@/src/api/reservation-tier-options';
import { AdminDialog } from '@/src/components/admin-dialog';
import { Iconify } from '@/src/components/iconify';
import { AmountOverrideField } from '@/src/components/manual-reservation-dialog/amount-override-field';
import { CustomLineFields } from '@/src/components/manual-reservation-dialog/custom-line-fields';
import { TierQuantityList } from '@/src/components/manual-reservation-dialog/tier-quantity-list';
import {
  hasErrors,
  MAX_RESERVATION_QTY,
  validateReservationLines,
  type ReservationLinesErrors,
} from '@/src/components/manual-reservation-dialog/validate-manual-reservation';
import { Typo } from '@/src/components/typo';
import { toItemsDialogRows } from '@/src/sections/reservations/utils/items-dialog-rows';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationItemsDialogProps {
  reservation: Reservation | null;
  tierOptions: ReservationTierOption[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: ReservationLinesFormInput) => void;
  onClose: () => void;
}

export function ReservationItemsDialog(props: ReservationItemsDialogProps) {
  return props.reservation ? (
    <ItemsDialogBody {...props} reservation={props.reservation} />
  ) : null;
}

function ItemsDialogBody({
  reservation,
  tierOptions,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: ReservationItemsDialogProps & { reservation: Reservation }) {
  const [form, setForm] = useState<ReservationLinesFormInput>(() =>
    toReservationLinesFormInput(reservation)
  );
  const [errors, setErrors] = useState<ReservationLinesErrors | null>(null);
  const { rows, prices } = toItemsDialogRows(reservation, tierOptions);
  const preview = previewLinesAmount(form, (id) => prices[id] ?? 0);
  const patch = (next: Partial<ReservationLinesFormInput>) =>
    setForm((current) => ({ ...current, ...next }));

  const handleSubmit = () => {
    const next = validateReservationLines(form);
    setErrors(next);
    if (!hasErrors(next)) onSubmit(form);
  };

  return (
    <AdminDialog
      open
      title={
        <span className='flex flex-col gap-1'>
          {MSG_D12.ITEMS_TITLE}
          <Typo.Badge.Regular color='text.secondary'>
            {`${reservation.code} · ${reservation.bookerName} · ${formatShowSlot(reservation.showDate, reservation.startTime, true)}`}
          </Typo.Badge.Regular>
        </span>
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      errorMessage={errorMessage}
      isBusy={isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={onClose}
            disabled={isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {MSG_COMMON.SAVE}
          </Button>
        </>
      }
    >
      <Alert
        severity='info'
        icon={<Iconify icon='solar:info-circle-linear' />}
        sx={{
          bgcolor: 'semantic.alert.infoBg',
          color: 'semantic.alert.infoFg',
        }}
      >
        <Typo.Badge.Regular color='inherit'>
          {MSG_D12.ITEMS_KEEP}
        </Typo.Badge.Regular>
      </Alert>
      <TierQuantityList
        rows={rows}
        quantities={form.tierQuantities}
        canIncrease={preview.quantity < MAX_RESERVATION_QTY}
        onChange={(tierId, quantity) =>
          patch({
            tierQuantities: {
              ...form.tierQuantities,
              [tierId]: String(quantity),
            },
          })
        }
      />
      {form.useCustom ? (
        <CustomLineFields
          label={form.customLabel}
          quantity={form.customQuantity}
          amount={form.customAmount}
          errors={{
            customLabel: errors?.customLabel ?? null,
            customQuantity: errors?.customQuantity ?? null,
            customAmount: errors?.customAmount ?? null,
          }}
          onChange={patch}
        />
      ) : null}
      {errors?.lines ? (
        <Typo.Caption.Regular color='error.main' role='alert'>
          {errors.lines}
        </Typo.Caption.Regular>
      ) : null}
      <AmountOverrideField
        checked={form.useAmountOverride}
        value={form.amountOverride}
        error={errors?.amountOverride ?? null}
        onToggle={(checked) => patch({ useAmountOverride: checked })}
        onChange={(value) => patch({ amountOverride: value })}
      />
      <Box
        aria-live='polite'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          px: 4,
          py: 3,
          borderRadius: 2,
          bgcolor: 'semantic.surface.hover',
        }}
      >
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D12.ITEMS_BEFORE(
            reservation.quantity,
            formatWon(reservation.amount)
          )}
        </Typo.Caption.Regular>
        <span className='flex justify-between gap-3'>
          <Typo.Badge.Medium>{MSG_D12.ITEMS_AFTER}</Typo.Badge.Medium>
          <Typo.Badge.Bold>
            {MSG_D12.MANUAL_TOTAL_VALUE(
              preview.quantity,
              formatWon(preview.amount)
            )}
          </Typo.Badge.Bold>
        </span>
      </Box>
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_D12.ITEMS_HELP}
      </Typo.Caption.Regular>
    </AdminDialog>
  );
}
