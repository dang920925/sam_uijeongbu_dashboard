'use client';

// ----------------------------------------------------------------------
// 일정 행 동작 — 수정(연필)·일정 취소(금지 원)/취소 해제(되돌리기)·삭제(휴지통, 빨강) 아이콘 버튼(시안 SCR-D08-U29 cancelled-list).
// aria-label·title = "일정 수정"·"일정 취소"/"취소 해제"·"일정 삭제"(designer W4 공통 · §14.3).
// 표 32 / xs 카드 44(테마 IconButton xs 터치).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import type {
  ScheduleRow,
  ScheduleRowHandlers,
} from '@/src/sections/schedules/utils/schedule-row';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ScheduleRowActionsProps {
  row: ScheduleRow;
  handlers: ScheduleRowHandlers;
}

const BUTTON_SX = {
  width: { xs: LAYOUT.touch, md: LAYOUT.controlSm },
  height: { xs: LAYOUT.touch, md: LAYOUT.controlSm },
};

export function ScheduleRowActions({ row, handlers }: ScheduleRowActionsProps) {
  return (
    <span className='inline-flex items-center gap-1'>
      <IconButton
        aria-label={MSG_D08.EDIT}
        title={MSG_D08.EDIT}
        onClick={() => handlers.onEdit(row.id)}
        sx={{ ...BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      {row.isCancelled ? (
        <IconButton
          aria-label={MSG_D08.RESTORE}
          title={MSG_D08.RESTORE}
          onClick={() => handlers.onRestore(row.id)}
          sx={{ ...BUTTON_SX, color: 'text.secondary' }}
        >
          <Iconify icon='solar:undo-left-linear' />
        </IconButton>
      ) : (
        <IconButton
          aria-label={MSG_D08.CANCEL}
          title={MSG_D08.CANCEL}
          onClick={() => handlers.onCancel(row.id)}
          sx={{ ...BUTTON_SX, color: 'text.secondary' }}
        >
          <Iconify icon='solar:forbidden-circle-linear' />
        </IconButton>
      )}
      <IconButton
        aria-label={MSG_D08.DELETE}
        title={MSG_D08.DELETE}
        onClick={() => handlers.onDelete(row.id)}
        sx={{ ...BUTTON_SX, color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    </span>
  );
}
