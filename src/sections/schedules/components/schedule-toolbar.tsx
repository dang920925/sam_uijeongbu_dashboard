'use client';

// ----------------------------------------------------------------------
// 도구 줄(design U23 보강) — 왼쪽 "오늘" · ‹ › (aria "이전"·"다음") · 범위 제목(aria-live), 오른쪽 보기 전환.
// 목록 보기에서는 날짜 이동·범위 제목을 숨긴다(목록은 범위가 없음 — designer §14.3). xs 는 두 줄로 접힌다.
// (v1.3.1) 보기 전환 앞 '연습실 예약' 표시 토글(aria-pressed, 기본 켜짐 — 빗금 견본 점).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import type { SegmentOption } from '@/src/components/segment-pill';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ROOM_TONE_SX } from '@/src/sections/schedules/components/schedule-tone';
import { ScheduleViewSwitch } from '@/src/sections/schedules/components/schedule-view-switch';
import type { CalendarView } from '@/src/sections/schedules/utils/calendar-nav';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ScheduleToolbarProps {
  view: CalendarView;
  viewOptions: SegmentOption<CalendarView>[];
  rangeTitle: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarView) => void;
  showRooms: boolean;
  onToggleRooms: () => void;
}

const NAV_SX = {
  width: { xs: LAYOUT.touch, md: LAYOUT.control },
  height: { xs: LAYOUT.touch, md: LAYOUT.control },
  color: 'text.primary',
};

export function ScheduleToolbar({
  view,
  viewOptions,
  rangeTitle,
  onToday,
  onPrev,
  onNext,
  onViewChange,
  showRooms,
  onToggleRooms,
}: ScheduleToolbarProps) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
      {view === 'list' ? null : (
        <div className='flex min-w-0 items-center gap-2'>
          <Button
            variant='outlined'
            color='inherit'
            size='small'
            onClick={onToday}
            sx={{ minWidth: 0, px: 3 }}
          >
            {MSG_D08.TODAY}
          </Button>
          <span className='inline-flex items-center'>
            <IconButton aria-label={MSG_D08.PREV} onClick={onPrev} sx={NAV_SX}>
              <Iconify icon='solar:alt-arrow-left-linear' size='md' />
            </IconButton>
            <IconButton aria-label={MSG_D08.NEXT} onClick={onNext} sx={NAV_SX}>
              <Iconify icon='solar:alt-arrow-right-linear' size='md' />
            </IconButton>
          </span>
          <Typo.Title.Bold
            component='h2'
            aria-live='polite'
            sx={{ whiteSpace: 'nowrap' }}
          >
            {rangeTitle}
          </Typo.Title.Bold>
        </div>
      )}
      <div className='flex flex-wrap items-center gap-3'>
        <Button
          variant={showRooms ? 'contained' : 'outlined'}
          color={showRooms ? 'primary' : 'inherit'}
          size='small'
          aria-pressed={showRooms}
          aria-label={MSG_D08.ROOM_LAYER_TOGGLE_ARIA}
          onClick={onToggleRooms}
          data-testid='room-layer-toggle'
          startIcon={
            <Box
              component='span'
              aria-hidden
              sx={[
                { width: 14, height: 14, borderRadius: '3px' },
                ROOM_TONE_SX as object,
              ]}
            />
          }
        >
          {MSG_D08.ROOM_LAYER}
        </Button>
        <ScheduleViewSwitch
          options={viewOptions}
          value={view}
          onChange={onViewChange}
        />
      </div>
    </div>
  );
}
