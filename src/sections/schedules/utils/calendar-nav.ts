// ----------------------------------------------------------------------
// 보기·기준 날짜(URL)·범위 계산(순수 함수) — U23 보강.
// - URL `?view=month|week|list`(기본 month), `?date=YYYY-MM-DD`(없거나 틀리면 오늘 KST).
// - xs 에는 주 보기가 없다 → week 면 month 로 본다.
// - ‹ › 는 월 = 한 달(그 달 1일), 주 = 7일. 조회 달 = 보이는 범위가 걸치는 달(월 격자 최대 3, 주 최대 2 — J-59).
// ----------------------------------------------------------------------
import type { YearMonth } from '@/src/api/schedule-queries';
import {
  addDays,
  addMonths,
  firstOfMonth,
  monthsBetween,
  parseDate,
  type DateParts,
} from '@/src/sections/schedules/utils/kst-calendar';
import { monthGridRange } from '@/src/sections/schedules/utils/schedule-month';
import { weekRange } from '@/src/sections/schedules/utils/schedule-week';
import { MSG_D08 } from '@/src/shared/messages/d08';

export type CalendarView = 'month' | 'week' | 'list';
export const CALENDAR_VIEWS: CalendarView[] = ['month', 'week', 'list'];

export function parseView(value: string | null): CalendarView {
  return CALENDAR_VIEWS.includes(value as CalendarView)
    ? (value as CalendarView)
    : 'month';
}

export function parseAnchor(value: string | null, today: string): string {
  return parseDate(value) ? (value as string) : today;
}

/** xs 에서 week → month */
export function effectiveView(view: CalendarView, isXs: boolean) {
  return isXs && view === 'week' ? 'month' : view;
}

/** 보이는 범위가 걸치는 달들(목록 보기는 없음) */
export function monthsForView(view: CalendarView, anchor: string): YearMonth[] {
  if (view === 'list') return [];
  const range = view === 'week' ? weekRange(anchor) : monthGridRange(anchor);
  return monthsBetween(range.start, range.end);
}

export function shiftAnchor(
  view: CalendarView,
  anchor: string,
  direction: -1 | 1
): string {
  return view === 'week'
    ? addDays(anchor, direction * 7)
    : addMonths(firstOfMonth(anchor), direction);
}

export function rangeTitle(view: CalendarView, anchor: string): string {
  if (view === 'week') {
    const { start, end } = weekRange(anchor);
    const s = parseDate(start) as DateParts;
    const e = parseDate(end) as DateParts;
    return MSG_D08.WEEK_TITLE(s.year, s.month, s.day, e.month, e.day);
  }
  const p = parseDate(anchor) as DateParts;
  return MSG_D08.MONTH_TITLE(p.year, p.month);
}

/** URL 쿼리 문자열 — 기본값(month·오늘)은 생략한다 */
export function toCalendarQuery(
  view: CalendarView,
  anchor: string,
  today: string
): string {
  const params = new URLSearchParams();
  if (view !== 'month') params.set('view', view);
  if (anchor !== today) params.set('date', anchor);
  const query = params.toString();
  return query ? `?${query}` : '';
}
