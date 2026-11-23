'use client';

// ----------------------------------------------------------------------
// (U46) 겹치는 팀 예약 경고 — 목록(팀 · 날짜·시간 · 작품) + '겹치는 예약 취소하고 저장' · '그대로 저장' · 돌아가기.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { AdminDialog } from '@/src/components/admin-dialog';
import { Typo } from '@/src/components/typo';
import { kstDateOf } from '@/src/sections/room-reservations/utils/room-week';
import type { RoomBlocksViewModel } from '@/src/sections/room-blocks/view/use-room-blocks-view-model';
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import { MSG_COMMON } from '@/src/shared/messages/common';

interface RoomBlockConflictDialogProps {
  conflict: RoomBlocksViewModel['conflict'];
}

const kstTime = (iso: string) =>
  new Date(Date.parse(iso) + 9 * 3_600_000).toISOString().slice(11, 16);

export function RoomBlockConflictDialog({
  conflict,
}: RoomBlockConflictDialogProps) {
  return (
    <AdminDialog
      open={conflict.isOpen}
      title={MSG_BLOCKS.CONFLICT_TITLE}
      onClose={conflict.onBack}
      isBusy={conflict.isSaving}
      actions={
        <div className='flex w-full flex-wrap justify-end gap-2'>
          <Button variant='outlined' color='inherit' onClick={conflict.onBack}>
            {MSG_COMMON.CLOSE}
          </Button>
          <Button
            variant='outlined'
            disabled={conflict.isSaving}
            onClick={conflict.onKeepReservations}
          >
            {MSG_BLOCKS.CONFLICT_KEEP}
          </Button>
          <Button
            variant='contained'
            color='error'
            disabled={conflict.isSaving}
            onClick={conflict.onCancelReservations}
          >
            {MSG_BLOCKS.CONFLICT_CANCEL}
          </Button>
        </div>
      }
    >
      <Typo.Body.Regular>
        {MSG_BLOCKS.CONFLICT_DESC(conflict.items.length)}
      </Typo.Body.Regular>
      <ul className='flex flex-col gap-1' data-testid='room-block-conflicts'>
        {conflict.items.map((c) => (
          <li key={c.id}>
            <Typo.Badge.Medium>
              {c.teamName} ·{' '}
              {kstDateOf(new Date(c.startAt)).replaceAll('-', '.')}{' '}
              {kstTime(c.startAt)}–{kstTime(c.endAt)} · {c.performanceTitle}
            </Typo.Badge.Medium>
          </li>
        ))}
      </ul>
    </AdminDialog>
  );
}
