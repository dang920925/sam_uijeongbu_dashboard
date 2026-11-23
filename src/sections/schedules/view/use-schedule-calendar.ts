'use client';

// ----------------------------------------------------------------------
// SCR-D08 캘린더 상태(U23 보강) — 보기·기준 날짜는 URL(`?view`·`?date`), 데이터는 보이는 범위가 걸치는 달마다(J-59).
// - xs 는 주 보기가 없다(week → month), 월 = 아젠다. 칩 개수 lg 3 · md 2.
// - 달/주 이동 방향을 기억해 격자 슬라이드 방향을 정한다(designer §14.4).
// - 현재 시각 선은 마운트 뒤 1분마다 갱신(하이드레이션 일치 — 첫 렌더는 null).
// - (v1.3.1) '연습실 예약' 레이어가 켜져 있으면 보기 범위(월·주·목록 30일)의 팀 연습실 예약을 받아 같은 격자에 섞는다
//   (빗금 칩 — 공식 일정 아님). 실패해도 일정은 그대로 보인다(레이어만 빠짐).
// JSX 없음.
// ----------------------------------------------------------------------
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAdminRoomReservations } from '@/src/api/practice-queries';
import { useScheduleMonths } from '@/src/api/schedule-queries';
import {
  effectiveView,
  monthsForView,
  parseAnchor,
  parseView,
  rangeTitle,
  shiftAnchor,
  toCalendarQuery,
  type CalendarView,
} from '@/src/sections/schedules/utils/calendar-nav';
import {
  compareEvents,
  toCalendarEvents,
} from '@/src/sections/schedules/utils/calendar-event';
import {
  roomRangeFor,
  toRoomCalendarEvents,
} from '@/src/sections/schedules/utils/room-event';
import { toKstMoment } from '@/src/sections/schedules/utils/kst-calendar';
import { buildAgenda } from '@/src/sections/schedules/utils/schedule-agenda';
import {
  buildMonthGrid,
  MONTH_CHIPS_LG,
  MONTH_CHIPS_MD,
} from '@/src/sections/schedules/utils/schedule-month';
import {
  buildWeek,
  initialScrollMinutes,
} from '@/src/sections/schedules/utils/schedule-week';
import type { ScheduleType } from '@/src/types/codes';

interface CalendarOptions {
  today: string;
  type: ScheduleType | undefined;
  isXs: boolean;
  isLg: boolean;
  /** v1.3.1 연습실 예약 레이어 표시 */
  showRooms: boolean;
}

const NOW_TICK_MS = 60_000;

function useNowMinutes(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(toKstMoment(new Date().toISOString())?.minutes ?? null);
    tick();
    const timer = window.setInterval(tick, NOW_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function useScheduleCalendar({
  today,
  type,
  isXs,
  isLg,
  showRooms,
}: CalendarOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const nowMinutes = useNowMinutes();

  const urlView = parseView(searchParams.get('view'));
  const urlAnchor = parseAnchor(searchParams.get('date'), today);
  // URL 갱신(router.replace)은 비동기라 빠른 연속 클릭이 같은 값에서 계산되지 않게, URL 이 따라올 때까지 이동한 값을 먼저 쓴다
  const [pending, setPending] = useState<{
    view: CalendarView;
    anchor: string;
  } | null>(null);
  if (pending && pending.view === urlView && pending.anchor === urlAnchor)
    setPending(null);
  const view = effectiveView(pending?.view ?? urlView, isXs);
  const anchor = pending?.anchor ?? urlAnchor;
  const months = useMemo(() => monthsForView(view, anchor), [view, anchor]);
  const query = useScheduleMonths(months, type);
  const roomRange = useMemo(
    () => roomRangeFor(view, anchor, today),
    [view, anchor, today]
  );
  const roomQuery = useAdminRoomReservations(roomRange, showRooms);
  const roomEvents = useMemo(
    () =>
      showRooms && roomQuery.data ? toRoomCalendarEvents(roomQuery.data) : [],
    [showRooms, roomQuery.data]
  );
  const events = useMemo(
    () => [...toCalendarEvents(query.items), ...roomEvents].sort(compareEvents),
    [query.items, roomEvents]
  );

  const monthWeeks = useMemo(
    () =>
      buildMonthGrid({
        anchor,
        today,
        events,
        maxChips: isLg ? MONTH_CHIPS_LG : MONTH_CHIPS_MD,
      }),
    [anchor, today, events, isLg]
  );
  const weekDays = useMemo(
    () => buildWeek({ anchor, today, events }),
    [anchor, today, events]
  );
  const agendaDays = useMemo(
    () => buildAgenda({ anchor, today, events }),
    [anchor, today, events]
  );

  const navigate = (nextView: CalendarView, nextAnchor: string) => {
    setPending({ view: nextView, anchor: nextAnchor });
    router.replace(
      `${pathname}${toCalendarQuery(nextView, nextAnchor, today)}`,
      { scroll: false }
    );
  };

  const move = (step: -1 | 1) => {
    setDirection(step);
    navigate(view, shiftAnchor(view, anchor, step));
  };

  return {
    view,
    anchor,
    rangeTitle: rangeTitle(view, anchor),
    /** 격자 다시 그리기 키(슬라이드 애니메이션) */
    rangeKey:
      view === 'week'
        ? `week-${weekDays[0].date}`
        : `${view}-${anchor.slice(0, 7)}`,
    direction,
    items: query.items,
    /** 연습실 예약 레이어(보기 범위) — 목록 보기 아래 목록 · 상세가 쓴다 */
    roomEvents,
    isRoomsError: showRooms && roomQuery.isError,
    monthWeeks,
    weekDays,
    weekScrollMinutes: initialScrollMinutes(weekDays),
    agendaDays,
    nowMinutes,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    onToday: () => {
      setDirection(anchor < today ? 1 : anchor > today ? -1 : 0);
      navigate(view, today);
    },
    onPrev: () => move(-1),
    onNext: () => move(1),
    onViewChange: (next: CalendarView) => {
      setDirection(0);
      navigate(next, anchor);
    },
    /** 저장 뒤 그 일정 날짜로(J-23) — 목록 보기는 그대로 */
    goToDate: (date: string) => {
      if (view !== 'list' && date !== anchor) navigate(view, date);
    },
  };
}

export type ScheduleCalendar = ReturnType<typeof useScheduleCalendar>;
