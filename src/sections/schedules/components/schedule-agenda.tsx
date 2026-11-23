'use client';

// ----------------------------------------------------------------------
// xs 월 보기 = 아젠다(design .agenda) — 일정 있는 날만 날짜 머리(요일·숫자, 오늘 원 강조) + 행.
// 행 = 색 막대 · "HH:mm – HH:mm" · 제목 · 장소, 취소면 제목 취소선 + "취소 · {사유}"(U29). 행 ≥ 44, 누르면 아래 시트 상세.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

import { Typo } from '@/src/components/typo';
import { eventBarColor } from '@/src/sections/schedules/components/schedule-tone';
import type { AgendaDay } from '@/src/sections/schedules/utils/schedule-agenda';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleAgendaProps {
  days: AgendaDay[];
  onOpenEvent: (id: string, anchor: HTMLElement) => void;
}

export function ScheduleAgenda({ days, onOpenEvent }: ScheduleAgendaProps) {
  return (
    <ul className='m-0 flex list-none flex-col p-0'>
      {days.map((day, index) => (
        <Box
          component='li'
          key={day.date}
          aria-current={day.isToday ? 'date' : undefined}
          sx={{
            display: 'flex',
            gap: 3,
            px: 4,
            py: 3,
            borderBottom: index === days.length - 1 ? 0 : 1,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 40,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: day.isToday ? 'text.primary' : 'text.secondary',
            }}
          >
            <Typo.Caption.Regular color='inherit'>
              {day.weekday}
            </Typo.Caption.Regular>
            <Box
              component='span'
              sx={{
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: day.isToday ? 'primary.main' : 'transparent',
                color: day.isToday ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typo.Badge.Semibold color='inherit'>
                {day.day}
              </Typo.Badge.Semibold>
            </Box>
          </Box>
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            {day.events.map((event) => (
              <ButtonBase
                key={event.id}
                aria-label={event.ariaLabel}
                aria-haspopup='dialog'
                onClick={(e) => onOpenEvent(event.id, e.currentTarget)}
                sx={{
                  width: '100%',
                  minHeight: LAYOUT.touch,
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  gap: 3,
                  p: 2,
                  borderRadius: `${RADIUS.sm}px`,
                  textAlign: 'left',
                  '&:hover': { bgcolor: 'semantic.surface.muted' },
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    flexShrink: 0,
                    borderRadius: 9999,
                    bgcolor: eventBarColor(event),
                  }}
                />
                <div className='flex min-w-0 flex-1 flex-col'>
                  <Typo.Caption.Regular
                    color='text.secondary'
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {event.timeText}
                  </Typo.Caption.Regular>
                  <span className='flex min-w-0 items-center gap-1'>
                    {event.isCancelled ? (
                      <Typo.Caption.Bold
                        color='semantic.text.onMuted'
                        sx={{ flexShrink: 0 }}
                      >
                        {MSG_D08.CANCELLED_TAG}
                      </Typo.Caption.Bold>
                    ) : null}
                    <Typo.Badge.Semibold
                      color={
                        event.isCancelled ? 'text.secondary' : 'text.primary'
                      }
                      noWrap
                      sx={{
                        textDecoration: event.isCancelled
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {event.title}
                    </Typo.Badge.Semibold>
                  </span>
                  {event.isCancelled && event.cancelReason ? (
                    <Typo.Caption.Regular color='semantic.text.onMuted'>
                      {MSG_D08.CANCELLED_REASON(event.cancelReason)}
                    </Typo.Caption.Regular>
                  ) : null}
                  {event.location ? (
                    <Typo.Caption.Regular color='text.secondary' noWrap>
                      {event.location}
                    </Typo.Caption.Regular>
                  ) : null}
                </div>
              </ButtonBase>
            ))}
          </div>
        </Box>
      ))}
    </ul>
  );
}
