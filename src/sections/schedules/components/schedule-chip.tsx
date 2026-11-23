'use client';

// ----------------------------------------------------------------------
// 월 칸 일정 칩 — "HH:mm 제목" 한 줄 말줄임, 높이 24(design u23-calendar.css .cal-chip).
// 취소면 앞에 "취소" + 제목 취소선(U29). 누르면 상세(onOpen 에 칩 요소를 넘겨 팝오버 기준으로).
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';
import type { MouseEvent } from 'react';

import { Typo } from '@/src/components/typo';
import { CAL } from '@/src/sections/schedules/utils/calendar-dimensions';
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { eventToneSx } from '@/src/sections/schedules/components/schedule-tone';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';
import { MOTION } from '@/src/theme/motion';

interface ScheduleChipProps {
  event: CalendarEvent;
  onOpen: (id: string, anchor: HTMLElement) => void;
}

export function ScheduleChip({ event, onOpen }: ScheduleChipProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpen(event.id, e.currentTarget);
  };
  return (
    <ButtonBase
      aria-label={event.ariaLabel}
      aria-haspopup='dialog'
      onClick={handleClick}
      sx={[
        {
          width: '100%',
          minWidth: 0,
          height: CAL.chip,
          flexShrink: 0,
          justifyContent: 'flex-start',
          gap: 1,
          px: 2,
          borderRadius: `${RADIUS.xs}px`,
          textAlign: 'left',
          transition: `background-color ${MOTION.duration.short}ms ${MOTION.easing.standard}, color ${MOTION.duration.short}ms ${MOTION.easing.standard}`,
        },
        eventToneSx(event) as object,
      ]}
    >
      {event.isCancelled ? (
        <Typo.Caption.Bold
          color='semantic.text.onMuted'
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {MSG_D08.CANCELLED_TAG}
        </Typo.Caption.Bold>
      ) : null}
      <Typo.Caption.Semibold
        color='inherit'
        sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
      >
        {event.startTime}
      </Typo.Caption.Semibold>
      <Typo.Caption.Regular
        color='inherit'
        noWrap
        sx={{
          minWidth: 0,
          textDecoration: event.isCancelled ? 'line-through' : 'none',
        }}
      >
        {event.title}
      </Typo.Caption.Regular>
    </ButtonBase>
  );
}
