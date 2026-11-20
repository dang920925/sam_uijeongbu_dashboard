'use client';

// ----------------------------------------------------------------------
// 메모 Dialog(designer dialog-memo) — textarea 최대 500자 · "관리자만 봅니다 · 최대 500자" / 취소 · 저장.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import type { Reservation } from '@/src/api/reservation-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationMemoDialogProps {
  reservation: Reservation | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (memo: string) => void;
  onClose: () => void;
}

export function ReservationMemoDialog(props: ReservationMemoDialogProps) {
  return props.reservation ? (
    <MemoDialogBody {...props} reservation={props.reservation} />
  ) : null;
}

function MemoDialogBody({
  reservation,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: ReservationMemoDialogProps & { reservation: Reservation }) {
  const [memo, setMemo] = useState(reservation.memo ?? '');
  const memoId = useId();
  return (
    <AdminDialog
      open
      title={`${MSG_D12.MEMO_TITLE} · ${reservation.code} ${reservation.bookerName}`}
      onClose={onClose}
      onSubmit={() => onSubmit(memo)}
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
      <FormField
        label={MSG_D12.MEMO_TITLE}
        htmlFor={memoId}
        helper={`${MSG_D12.MEMO_HELP} (${memo.length}/500)`}
      >
        <TextField
          id={memoId}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          multiline
          minRows={4}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </FormField>
    </AdminDialog>
  );
}
