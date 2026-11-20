'use client';

// ----------------------------------------------------------------------
// 월 보기(md↑) — 6주 × 7열 격자(role="grid"), 앞뒤 달 날짜는 흐리게(design U23 보강 · u23-calendar.css .cal-month).
// 칸 = 날짜 숫자(오늘 원 강조) + 칩(lg 3 · md 2) + "+n개 더". 칸 빈 자리를 누르거나 칸에서 Enter → 그 날 00:00 추가(J-19).
// 첫 로딩은 칩 자리 스켈레톤(격자 유지).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import type { KeyboardEvent, MouseEvent } from 'react';

import { Typo } from '@/src/components/typo';
import { ScheduleChip } from '@/src/sections/schedules/components/schedule-chip';
import { CAL } from '@/src/sections/schedules/utils/calendar-dimensions';
import { WEEKDAY_LABELS } from '@/src/sections/schedules/utils/kst-calendar';
import type { MonthCell } from '@/src/sections/schedules/utils/schedule-month';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleMonthGridProps {
  ariaLabel: string;
  weeks: MonthCell[][];
  isPending: boolean;
  activeMoreDate: string | null;
  onAdd: (date: string) => void;
  onOpenEvent: (id: string, anchor: HTMLElement) => void;
  onOpenMore: (date: string, anchor: HTMLElement) => void;
}

const LINE = { borderColor: 'divider', borderStyle: 'solid', borderWidth: 0 };

export function ScheduleMonthGrid({
  ariaLabel,
  weeks,
  isPending,
  activeMoreDate,
  onAdd,
  onOpenEvent,
  onOpenMore,
}: ScheduleMonthGridProps) {
  const handleKey = (date: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdd(date);
    }
  };
  const handleMore = (date: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpenMore(date, e.currentTarget);
  };

  return (
    <Box
      role='grid'
      aria-label={ariaLabel}
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
    >
      <div role='row' className='contents'>
        {WEEKDAY_LABELS.map((label) => (
          <Box
            key={label}
            role='columnheader'
            sx={{
              ...LINE,
              borderBottomWidth: 1,
              py: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typo.Caption.Semibold color='text.secondary'>
              {label}
            </Typo.Caption.Semibold>
          </Box>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].date} role='row' className='contents'>
          {week.map((cell, index) => (
            <Box
              key={cell.date}
              role='gridcell'
              tabIndex={0}
              aria-label={cell.ariaLabel}
              aria-current={cell.isToday ? 'date' : undefined}
              onClick={() => onAdd(cell.date)}
              onKeyDown={handleKey(cell.date)}
              sx={{
                ...LINE,
                borderBottomWidth: 1,
                borderRightWidth: index === 6 ? 0 : 1,
                minWidth: 0,
                minHeight: { md: CAL.dayMd, lg: CAL.dayLg },
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: 'pointer',
                bgcolor: cell.isOutside ? 'background.default' : 'transparent',
                '&:hover': { bgcolor: 'semantic.surface.hover' },
                '&:focus-visible': {
                  outline: 2,
                  outlineColor: 'primary.main',
                  outlineOffset: -2,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  component='span'
                  sx={{
                    width: CAL.chip,
                    height: CAL.chip,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: cell.isToday ? 'primary.main' : 'transparent',
                    color: cell.isToday
                      ? 'primary.contrastText'
                      : cell.isOutside
                        ? 'text.secondary'
                        : 'text.primary',
                  }}
                >
                  {cell.isOutside ? (
                    <Typo.Caption.Regular color='inherit'>
                      {cell.day}
                    </Typo.Caption.Regular>
                  ) : (
                    <Typo.Caption.Semibold color='inherit'>
                      {cell.day}
                    </Typo.Caption.Semibold>
                  )}
                </Box>
              </Box>
              {isPending && !cell.isOutside ? (
                <Skeleton
                  variant='rounded'
                  height={CAL.chip}
                  sx={{ bgcolor: 'semantic.surface.skeleton' }}
                />
              ) : null}
              {cell.events.map((event) => (
                <ScheduleChip
                  key={event.id}
                  event={event}
                  onOpen={onOpenEvent}
                />
              ))}
              {cell.hiddenCount > 0 ? (
                <ButtonBase
                  aria-haspopup='dialog'
                  aria-expanded={activeMoreDate === cell.date}
                  onClick={handleMore(cell.date)}
                  sx={{
                    alignSelf: 'flex-start',
                    height: CAL.chip,
                    px: 2,
                    borderRadius: `${RADIUS.xs}px`,
                    color: 'text.primary',
                    bgcolor:
                      activeMoreDate === cell.date
                        ? 'semantic.surface.muted'
                        : 'transparent',
                    '&:hover': { bgcolor: 'semantic.surface.muted' },
                  }}
                >
                  <Typo.Caption.Semibold color='inherit'>
                    {MSG_D08.MORE(cell.hiddenCount)}
                  </Typo.Caption.Semibold>
                </ButtonBase>
              ) : null}
            </Box>
          ))}
        </div>
      ))}
    </Box>
  );
}
