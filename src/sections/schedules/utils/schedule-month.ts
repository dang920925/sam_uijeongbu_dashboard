// ----------------------------------------------------------------------
// 월 보기 격자(순수 함수) — 6주 × 7열(일요일 첫 열), 앞뒤 달 날짜도 칸으로(흐리게) 그린다(U23 보강).
// 칸마다 칩(시작 시각 순), 보일 개수 = 구간 상수(lg 3 · md 2), 나머지 = "+n개 더"(hiddenCount).
// ----------------------------------------------------------------------
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { groupByDate } from '@/src/sections/schedules/utils/calendar-event';
import {
  addDays,
  firstOfMonth,
  parseDate,
  startOfWeek,
  WEEKDAY_LABELS,
  type DateParts,
} from '@/src/sections/schedules/utils/kst-calendar';
import { MSG_D08 } from '@/src/shared/messages/d08';

/** 칩 보일 개수 — lg 3 · md 2(design U23 보강) */
export const MONTH_CHIPS_LG = 3;
export const MONTH_CHIPS_MD = 2;
const GRID_DAYS = 42;

export interface MonthCell {
  date: string;
  day: number;
  isOutside: boolean;
  isToday: boolean;
  ariaLabel: string;
  /** 더보기 팝오버 제목 "{m}월 {d}일 {요일}요일" */
  dayTitle: string;
  /** 보이는 칩 */
  events: CalendarEvent[];
  /** 그 날 전체(더보기 팝오버) */
  allEvents: CalendarEvent[];
  hiddenCount: number;
}

/** 기준 날짜가 든 달의 6주 격자 범위(포함) */
export function monthGridRange(anchor: string): { start: string; end: string } {
  const start = startOfWeek(firstOfMonth(anchor));
  return { start, end: addDays(start, GRID_DAYS - 1) };
}

export function buildMonthGrid(params: {
  anchor: string;
  today: string;
  events: CalendarEvent[];
  maxChips: number;
}): MonthCell[][] {
  const { anchor, today, events, maxChips } = params;
  const month = (parseDate(anchor) as DateParts).month;
  const byDate = groupByDate(events);
  const { start } = monthGridRange(anchor);
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < GRID_DAYS; i += 1) {
    const date = addDays(start, i);
    const p = parseDate(date) as DateParts;
    const allEvents = byDate.get(date) ?? [];
    const isToday = date === today;
    const cell: MonthCell = {
      date,
      day: p.day,
      isOutside: p.month !== month,
      isToday,
      ariaLabel: MSG_D08.CELL_ARIA(
        p.year,
        p.month,
        p.day,
        isToday,
        allEvents.length
      ),
      dayTitle: MSG_D08.DAY_TITLE(p.month, p.day, WEEKDAY_LABELS[i % 7]),
      events: allEvents.slice(0, maxChips),
      allEvents,
      hiddenCount: Math.max(0, allEvents.length - maxChips),
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
  }
  return weeks;
}
