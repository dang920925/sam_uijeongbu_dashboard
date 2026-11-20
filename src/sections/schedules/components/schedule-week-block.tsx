'use client';

// ----------------------------------------------------------------------
// 주 보기 일정 블록 — top/height 는 분 × 0.8px(1시간 48), 겹침은 열 폭 나눔(J-62).
// 안: 제목(굵게) · 시간 · 장소(공간 있을 때) · 취소면 "취소 · {사유}" · 자정 넘김 "→ 다음 날 HH:mm"(design .cal-block).
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';
import type { MouseEvent } from 'react';

import { Typo } from '@/src/components/typo';
import {
  scheduleBarColor,
  scheduleToneSx,
} from '@/src/sections/schedules/components/schedule-tone';
import { MINUTE_PX } from '@/src/sections/schedules/utils/calendar-dimensions';
import type { WeekBlock } from '@/src/sections/schedules/utils/schedule-week';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleWeekBlockProps {
  block: WeekBlock;
  onOpen: (id: string, anchor: HTMLElement) => void;
}

/** 2시간 이상이면 제목 줄바꿈 허용(.cal-block--tall), 90분 이상이면 장소 줄 */
const TALL_MINUTES = 120;
const LOCATION_MINUTES = 90;

export function ScheduleWeekBlock({ block, onOpen }: ScheduleWeekBlockProps) {
  const { event } = block;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpen(event.id, e.currentTarget);
  };
  const isTall = block.height >= TALL_MINUTES;
  return (
    <ButtonBase
      aria-label={event.ariaLabel}
      aria-haspopup='dialog'
      onClick={handleClick}
      sx={[
        {
          position: 'absolute',
          zIndex: 1,
          top: block.top * MINUTE_PX,
          height: block.height * MINUTE_PX,
          left: `calc(${(block.column / block.columns) * 100}% + 2px)`,
          width: `calc(${100 / block.columns}% - 4px)`,
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          px: 2,
          py: 1,
          overflow: 'hidden',
          textAlign: 'left',
          borderRadius: `${RADIUS.sm}px`,
          boxSizing: 'border-box',
        },
        scheduleToneSx(event.type, event.isCancelled) as object,
        {
          borderLeft: 4,
          borderLeftStyle: event.isCancelled ? 'dashed' : 'solid',
          borderLeftColor: scheduleBarColor(event.type, event.isCancelled),
        },
      ]}
    >
      <Typo.Caption.Semibold
        color='inherit'
        noWrap={!isTall}
        sx={{
          textDecoration: event.isCancelled ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}
      >
        {event.title}
      </Typo.Caption.Semibold>
      <Typo.Caption.Regular
        color='inherit'
        noWrap
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {event.timeText}
      </Typo.Caption.Regular>
      {event.isCancelled && event.cancelReason ? (
        <Typo.Caption.Semibold color='semantic.text.onMuted' noWrap>
          {MSG_D08.CANCELLED_REASON(event.cancelReason)}
        </Typo.Caption.Semibold>
      ) : null}
      {event.location && block.height >= LOCATION_MINUTES ? (
        <Typo.Caption.Regular color='inherit' noWrap>
          {event.location}
        </Typo.Caption.Regular>
      ) : null}
      {block.overnightEnd ? (
        <Typo.Caption.Semibold color='inherit' noWrap sx={{ mt: 'auto' }}>
          {MSG_D08.OVERNIGHT(block.overnightEnd)}
        </Typo.Caption.Semibold>
      ) : null}
    </ButtonBase>
  );
}
