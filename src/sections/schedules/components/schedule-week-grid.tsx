'use client';

// ----------------------------------------------------------------------
// 주 보기(md↑) — 시간 눈금(00~23시, 1시간 48) + 7열(머리 요일·날짜, 오늘 원 강조), design .cal-week.
// - 빈 30분 칸 = 버튼(aria "{M}월 {D}일 {HH:mm} 일정 추가") → 그 칸 시작 + 1시간 추가(J-60).
// - 현재 시각 선은 오늘 열에만(장식 — aria-hidden).
// - 첫 세로 스크롤 = 가장 이른 일정 1시간 전 또는 09:00(범위가 바뀔 때마다).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { useLayoutEffect, useRef } from 'react';

import { Typo } from '@/src/components/typo';
import { ScheduleWeekBlock } from '@/src/sections/schedules/components/schedule-week-block';
import {
  CAL,
  MINUTE_PX,
} from '@/src/sections/schedules/utils/calendar-dimensions';
import {
  HOUR_LABELS,
  SLOT_MINUTES,
  type WeekDay,
} from '@/src/sections/schedules/utils/schedule-week';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleWeekGridProps {
  rangeKey: string;
  isPending: boolean;
  days: WeekDay[];
  scrollMinutes: number;
  nowMinutes: number | null;
  onAdd: (date: string, minutes: number) => void;
  onOpenEvent: (id: string, anchor: HTMLElement) => void;
}

const COLUMNS = `${CAL.gutter}px repeat(7, minmax(0, 1fr))`;
const DAY_HEIGHT = CAL.hour * 24;
/** 스크롤 영역 = 화면 높이 − (헤더·머리·도구 줄·요일 머리) */
const SCROLL_HEIGHT = 'calc(100dvh - 320px)';

export function ScheduleWeekGrid({
  rangeKey,
  isPending,
  days,
  scrollMinutes,
  nowMinutes,
  onAdd,
  onOpenEvent,
}: ScheduleWeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    // 범위마다 한 번 — 그 범위 데이터가 온 뒤에 맞춘다(같은 주에서 데이터가 바뀌면 그대로)
    if (isPending || appliedKey.current === rangeKey || !scrollRef.current)
      return;
    appliedKey.current = rangeKey;
    scrollRef.current.scrollTop = scrollMinutes * MINUTE_PX;
  }, [rangeKey, isPending, scrollMinutes]);

  return (
    // 머리를 스크롤 영역 안에 sticky 로 두어 세로 스크롤바 폭만큼 열이 어긋나지 않게 한다
    <Box
      ref={scrollRef}
      sx={{ overflowY: 'auto', height: SCROLL_HEIGHT, minHeight: CAL.weekMin }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 3,
          display: 'grid',
          gridTemplateColumns: COLUMNS,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <span />
        {days.map((day) => (
          <Box
            key={day.date}
            aria-current={day.isToday ? 'date' : undefined}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              py: 2,
              color: day.isToday ? 'text.primary' : 'text.secondary',
            }}
          >
            <Typo.Caption.Regular color='inherit'>
              {day.weekday}
            </Typo.Caption.Regular>
            <Box
              component='span'
              sx={{
                width: CAL.chip + 8,
                height: CAL.chip + 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: day.isToday ? 'primary.main' : 'transparent',
                color: day.isToday ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typo.Title.Semibold color='inherit'>
                {day.day}
              </Typo.Title.Semibold>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: COLUMNS }}>
        <div aria-hidden>
          {HOUR_LABELS.map((label, hour) => (
            <Box
              key={label}
              sx={{ height: CAL.hour, textAlign: 'right', pr: 2 }}
            >
              {hour > 0 ? (
                <Typo.Caption.Regular
                  color='text.secondary'
                  sx={{ position: 'relative', top: -8 }}
                >
                  {label}
                </Typo.Caption.Regular>
              ) : null}
            </Box>
          ))}
        </div>
        {days.map((day) => (
          <Box
            key={day.date}
            sx={(t) => ({
              position: 'relative',
              height: DAY_HEIGHT,
              borderLeft: 1,
              borderColor: 'divider',
              backgroundImage: `repeating-linear-gradient(to bottom, ${t.palette.divider} 0 1px, transparent 1px ${CAL.hour / 2}px, ${t.palette.semantic.surface.muted} ${CAL.hour / 2}px ${CAL.hour / 2 + 1}px, transparent ${CAL.hour / 2 + 1}px ${CAL.hour}px)`,
            })}
          >
            {day.slots.map((slot) => (
              <ButtonBase
                key={slot.minutes}
                aria-label={slot.ariaLabel}
                onClick={() => onAdd(day.date, slot.minutes)}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: slot.minutes * MINUTE_PX,
                  height: SLOT_MINUTES * MINUTE_PX,
                  borderRadius: `${RADIUS.xs}px`,
                  '&:hover': { bgcolor: 'semantic.surface.hover' },
                  '&.Mui-focusVisible, &:focus-visible': {
                    bgcolor: 'semantic.surface.muted',
                    outline: 2,
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                  },
                }}
              />
            ))}
            {day.blocks.map((block) => (
              <ScheduleWeekBlock
                key={block.event.id}
                block={block}
                onOpen={onOpenEvent}
              />
            ))}
            {day.isToday && nowMinutes !== null ? (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  top: nowMinutes * MINUTE_PX,
                  height: 2,
                  bgcolor: 'error.main',
                  pointerEvents: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: -5,
                    top: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                  },
                }}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
