// ----------------------------------------------------------------------
// xs 월 보기 = 아젠다(순수 함수) — 그 달 날짜 중 일정 있는 날만 머리(요일·날짜) + 행(U23 보강).
// 0건이면 빈 배열 → 화면이 "이 달에는 일정이 없습니다".
// ----------------------------------------------------------------------
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { groupByDate } from '@/src/sections/schedules/utils/calendar-event';
import {
  dayOfWeek,
  firstOfMonth,
  lastOfMonth,
  parseDate,
  WEEKDAY_LABELS,
  type DateParts,
} from '@/src/sections/schedules/utils/kst-calendar';

export interface AgendaDay {
  date: string;
  day: number;
  weekday: string;
  isToday: boolean;
  events: CalendarEvent[];
}

export function buildAgenda(params: {
  anchor: string;
  today: string;
  events: CalendarEvent[];
}): AgendaDay[] {
  const start = firstOfMonth(params.anchor);
  const end = lastOfMonth(params.anchor);
  const days: AgendaDay[] = [];
  for (const [date, events] of groupByDate(params.events)) {
    if (date < start || date > end) continue;
    days.push({
      date,
      day: (parseDate(date) as DateParts).day,
      weekday: WEEKDAY_LABELS[dayOfWeek(date)],
      isToday: date === params.today,
      events,
    });
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : 1));
}
