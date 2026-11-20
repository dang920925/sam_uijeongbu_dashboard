'use client';

// ----------------------------------------------------------------------
// 일정 행 동작 — 수정(연필)·삭제(휴지통, 빨강) 아이콘 버튼. aria-label·title = "일정 수정"·"일정 삭제"(designer W4 공통).
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
