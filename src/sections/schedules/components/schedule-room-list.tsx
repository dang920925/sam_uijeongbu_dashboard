'use client';

// ----------------------------------------------------------------------
// 목록 보기의 '연습실 예약' 레이어(v1.3.1) — 오늘부터 30일 안의 팀 연습실 예약을 빗금 줄로(공식 일정 표 아래).
// 줄을 누르면 상세(팀·시간·메모·예약 삭제). 레이어가 꺼져 있으면 그리지 않는다(ViewModel 이 null).
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import type { MouseEvent } from 'react';

import { Typo } from '@/src/components/typo';
import { ROOM_TONE_SX } from '@/src/sections/schedules/components/schedule-tone';
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleRoomListProps {
  events: CalendarEvent[];
  onOpenEvent: (id: string, anchor: HTMLElement) => void;
}

export function ScheduleRoomList({
  events,
  onOpenEvent,
}: ScheduleRoomListProps) {
  return (
    <Card sx={{ p: { xs: 4, md: 6 } }} data-testid='schedule-room-list'>
      <Typo.Title.Bold component='h3' sx={{ mb: 3 }}>
        {MSG_D08.ROOM_LIST_TITLE}
      </Typo.Title.Bold>
      {events.length === 0 ? (
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D08.ROOM_LIST_EMPTY}
        </Typo.Badge.Regular>
      ) : (
        <ul className='flex flex-col gap-2'>
          {events.map((event) => (
            <li key={event.id}>
              <ButtonBase
                aria-label={event.ariaLabel}
                aria-haspopup='dialog'
                onClick={(e: MouseEvent<HTMLButtonElement>) =>
                  onOpenEvent(event.id, e.currentTarget)
                }
                sx={[
                  {
                    width: '100%',
                    minHeight: 44,
                    justifyContent: 'flex-start',
                    gap: 3,
                    px: 3,
                    borderRadius: `${RADIUS.xs}px`,
                    textAlign: 'left',
                  },
                  ROOM_TONE_SX as object,
                ]}
              >
                <Typo.Badge.Medium
                  color='inherit'
                  sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
                >
                  {`${event.date.slice(5).replace('-', '.')} ${event.timeText}`}
                </Typo.Badge.Medium>
                <Typo.Badge.Regular color='inherit' noWrap>
                  {event.title}
                </Typo.Badge.Regular>
              </ButtonBase>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
