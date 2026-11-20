'use client';

// ----------------------------------------------------------------------
// "+n개 더" → 그 날 전체 칩 목록 팝오버(폭 288, 제목 "{m}월 {d}일 {요일}요일") — design .cal-popover--more.
// 칩을 누르면 상세로 넘어간다(ViewModel 이 더보기 단추에 상세를 붙인다).
// ----------------------------------------------------------------------
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { useId } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ScheduleChip } from '@/src/sections/schedules/components/schedule-chip';
import { CAL } from '@/src/sections/schedules/utils/calendar-dimensions';
import type { MonthCell } from '@/src/sections/schedules/utils/schedule-month';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { RADIUS } from '@/src/theme/layout-tokens';
import { MOTION } from '@/src/theme/motion';

interface ScheduleMorePopoverProps {
  cell: MonthCell | null;
  anchor: HTMLElement | null;
  onOpenEvent: (id: string, anchor: HTMLElement) => void;
  onClose: () => void;
}

export function ScheduleMorePopover({
  cell,
  anchor,
  onOpenEvent,
  onClose,
}: ScheduleMorePopoverProps) {
  const titleId = useId();
  return (
    <Popover
      open={Boolean(cell && anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slots={{ transition: Fade }}
      transitionDuration={MOTION.duration.short}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-labelledby': titleId,
          sx: {
            width: CAL.more,
            mt: 1,
            borderRadius: `${RADIUS.md}px`,
            border: 1,
            borderColor: 'divider',
          },
        } as object,
      }}
    >
      {cell ? (
        <div className='flex flex-col gap-2 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <Typo.Title.Bold component='h2' id={titleId}>
              {cell.dayTitle}
            </Typo.Title.Bold>
            <IconButton
              aria-label={MSG_COMMON.CLOSE}
              onClick={onClose}
              sx={{ mr: -2, color: 'text.secondary' }}
            >
              <Iconify icon='solar:close-circle-linear' size='md' />
            </IconButton>
          </div>
          <div className='flex flex-col gap-1'>
            {cell.allEvents.map((event) => (
              <ScheduleChip key={event.id} event={event} onOpen={onOpenEvent} />
            ))}
          </div>
        </div>
      ) : null}
    </Popover>
  );
}
