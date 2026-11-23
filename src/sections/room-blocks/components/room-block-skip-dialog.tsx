'use client';

// ----------------------------------------------------------------------
// (U46) 이 날만 해제 — 날짜 하나 고르기(블록 기간 안). 막은 시간이 없는 날이면 서버 문구(COMMON_001)를 스낵바로.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import type { RoomBlocksViewModel } from '@/src/sections/room-blocks/view/use-room-blocks-view-model';
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import { MSG_COMMON } from '@/src/shared/messages/common';

interface RoomBlockSkipDialogProps {
  skip: RoomBlocksViewModel['skipDialog'];
}

export function RoomBlockSkipDialog({ skip }: RoomBlockSkipDialogProps) {
  const dateId = useId();
  return (
    <AdminDialog
      open={skip.isOpen}
      title={`${MSG_BLOCKS.SKIP_TITLE} — ${skip.title}`}
      onClose={skip.onClose}
      onSubmit={skip.onConfirm}
      isBusy={skip.isBusy}
      actions={
        <>
          <Button variant='outlined' color='inherit' onClick={skip.onClose}>
            {MSG_COMMON.CLOSE}
          </Button>
          <Button type='submit' variant='contained' disabled={skip.isBusy}>
            {MSG_BLOCKS.SKIP}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_BLOCKS.LABEL_DATE}
        htmlFor={dateId}
        helper={MSG_BLOCKS.SKIP_HELP}
      >
        <TextField
          id={dateId}
          type='date'
          value={skip.date}
          onChange={(e) => skip.onDateChange(e.target.value)}
          slotProps={{ htmlInput: { min: skip.min, max: skip.max } }}
        />
      </FormField>
    </AdminDialog>
  );
}
