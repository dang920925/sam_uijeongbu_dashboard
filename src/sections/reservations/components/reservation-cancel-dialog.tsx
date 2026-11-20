'use client';

// ----------------------------------------------------------------------
// 취소 Dialog(designer dialog-cancel) — "예매를 취소하시겠습니까?" + 예매 요약 + 사유 radiogroup
// (예매자 요청·관리자·기한 지남 — 기한 지난 건은 '기한 지남' 미리 선택) / 닫기 · 예매 취소.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useId, useState } from 'react';

import {
  formatShowSlot,
  formatTierBreakdown,
  formatWon,
  type Reservation,
} from '@/src/api/reservation-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { MSG_D12 } from '@/src/shared/messages/d12';
import type { CancelReason } from '@/src/types/booking';
import { CANCEL_REASON_LABEL, CANCEL_REASONS } from '@/src/types/codes';

interface ReservationCancelDialogProps {
  reservation: Reservation | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (reason: CancelReason) => void;
  onClose: () => void;
}

export function ReservationCancelDialog(props: ReservationCancelDialogProps) {
  return props.reservation ? (
    <CancelDialogBody {...props} reservation={props.reservation} />
  ) : null;
}

function CancelDialogBody({
  reservation,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: ReservationCancelDialogProps & { reservation: Reservation }) {
  const [reason, setReason] = useState<CancelReason>(
    reservation.deadlinePassed ? 'DEADLINE_PASSED' : 'BOOKER_REQUEST'
  );
  const labelId = useId();
  const summary = [
    reservation.code,
    reservation.bookerName,
    formatShowSlot(reservation.showDate, reservation.startTime, true),
    formatTierBreakdown(reservation.items),
    formatWon(reservation.amount),
  ].join(' · ');
  return (
    <AdminDialog
      open
      title={MSG_D12.CANCEL_TITLE}
      onClose={onClose}
      onSubmit={() => onSubmit(reason)}
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
            {MSG_D12.CANCEL_CLOSE}
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='error'
            disabled={isSubmitting}
          >
            {MSG_D12.CANCEL_SUBMIT}
          </Button>
        </>
      }
    >
      <Typo.Body.Regular>{summary}</Typo.Body.Regular>
      <FormField label={MSG_D12.CANCEL_REASON} asGroup labelId={labelId}>
        <RadioGroup
          aria-labelledby={labelId}
          value={reason}
          onChange={(event) => setReason(event.target.value as CancelReason)}
        >
          {CANCEL_REASONS.map((value) => (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio />}
              label={
                <Typo.Body.Regular>
                  {CANCEL_REASON_LABEL[value]}
                </Typo.Body.Regular>
              }
              sx={{ m: 0, minHeight: 44 }}
            />
          ))}
        </RadioGroup>
      </FormField>
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_D12.CANCEL_HELP}
      </Typo.Caption.Regular>
    </AdminDialog>
  );
}
