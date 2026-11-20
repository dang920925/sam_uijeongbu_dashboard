'use client';

// ----------------------------------------------------------------------
// 일정 상세 — md↑ 칩·블록 옆 팝오버(폭 360), xs 아래 시트(design .cal-popover · .cal-sheet). role="dialog"(포커스 이동·Esc·바깥 클릭).
// 모션(designer §14.4): 팝오버 페이드 short / 시트 아래에서 올라옴 medium. reduced-motion 은 테마 전역이 즉시로 바꾼다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Fade from '@mui/material/Fade';
import Popover from '@mui/material/Popover';
import { useId } from 'react';

import { ScheduleDetailContent } from '@/src/sections/schedules/components/schedule-detail-content';
import { CAL } from '@/src/sections/schedules/utils/calendar-dimensions';
import type { ScheduleDetail } from '@/src/sections/schedules/utils/schedule-detail';
import type { ScheduleRowHandlers } from '@/src/sections/schedules/utils/schedule-row';
import { RADIUS } from '@/src/theme/layout-tokens';
import { MOTION } from '@/src/theme/motion';

interface ScheduleDetailPopoverProps {
  detail: ScheduleDetail | null;
  anchor: HTMLElement | null;
  isSheet: boolean;
  handlers: ScheduleRowHandlers;
  onClose: () => void;
}

export function ScheduleDetailPopover({
  detail,
  anchor,
  isSheet,
  handlers,
  onClose,
}: ScheduleDetailPopoverProps) {
  const titleId = useId();
  const content = detail ? (
    <ScheduleDetailContent
      detail={detail}
      titleId={titleId}
      isSheet={isSheet}
      handlers={handlers}
      onClose={onClose}
    />
  ) : null;

  if (isSheet)
    return (
      <Drawer
        anchor='bottom'
        open={Boolean(detail)}
        onClose={onClose}
        transitionDuration={MOTION.duration.medium}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-modal': true,
            'aria-labelledby': titleId,
            sx: {
              borderTopLeftRadius: RADIUS.lg,
              borderTopRightRadius: RADIUS.lg,
              maxHeight: 'calc(100dvh - 64px)',
            },
          } as object,
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 4,
            borderRadius: 9999,
            bgcolor: 'divider',
            mx: 'auto',
            mt: 2,
          }}
        />
        {content}
      </Drawer>
    );

  return (
    <Popover
      open={Boolean(detail && anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slots={{ transition: Fade }}
      transitionDuration={MOTION.duration.short}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-labelledby': titleId,
          sx: {
            width: CAL.popover,
            maxWidth: 'calc(100vw - 32px)',
            mt: 1,
            borderRadius: `${RADIUS.md}px`,
            border: 1,
            borderColor: 'divider',
          },
        } as object,
      }}
    >
      {content}
    </Popover>
  );
}
