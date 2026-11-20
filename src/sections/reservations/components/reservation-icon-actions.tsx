'use client';

// ----------------------------------------------------------------------
// 행 아이콘 버튼 — 등급 수정(티켓 · 취소 건 제외) · 메모(없음 = 연필 "메모 추가", 있음 = 노트 "메모 보기·수정").
// 표 32 / 카드(xs) 44.
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';
import type { MouseEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import type { ReservationRowHandlers } from '@/src/sections/reservations/components/reservation-action-buttons';
import type { ReservationRow } from '@/src/sections/reservations/utils/reservation-row';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationIconActionsProps {
  row: Pick<ReservationRow, 'id' | 'code' | 'hasMemo' | 'canEditItems'>;
  handlers: ReservationRowHandlers;
}

const BUTTON_SX = {
  width: { xs: 44, lg: 32 },
  height: { xs: 44, lg: 32 },
  color: 'text.secondary',
};

export function ReservationIconActions({
  row,
  handlers,
}: ReservationIconActionsProps) {
  const run = (fn: (id: string) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    fn(row.id);
  };
  const memoLabel = row.hasMemo ? MSG_D12.MEMO_EDIT : MSG_D12.MEMO_ADD;
  return (
    <span className='inline-flex items-center gap-1'>
      {row.canEditItems ? (
        <IconButton
          aria-label={`${row.code} ${MSG_D12.ACT_ITEMS}`}
          title={MSG_D12.ACT_ITEMS}
          onClick={run(handlers.onRequestItems)}
          sx={BUTTON_SX}
        >
          <Iconify icon='solar:ticket-linear' />
        </IconButton>
      ) : null}
      <IconButton
        aria-label={`${row.code} ${memoLabel}`}
        title={memoLabel}
        onClick={run(handlers.onRequestMemo)}
        sx={{
          ...BUTTON_SX,
          color: row.hasMemo ? 'text.primary' : 'text.secondary',
        }}
      >
        <Iconify
          icon={row.hasMemo ? 'solar:notes-linear' : 'solar:pen-linear'}
        />
      </IconButton>
    </span>
  );
}
