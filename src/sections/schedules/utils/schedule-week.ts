// ----------------------------------------------------------------------
// 주 보기 배치(순수 함수) — 7열(일~토) × 시간 축(00~23시).
// - 블록 top = 시작 분, height = max(30분, 종료 − 시작), 종료 없음 = 60분(J-61). 단위는 분(화면이 px 로 바꾼다).
// - 자정을 넘는 일정은 시작 날 열 끝(24:00)까지 자르고 overnightEnd 에 종료 시각을 둔다("→ 다음 날 HH:mm").
// - 겹침: 서로 겹치는 묶음마다 열을 나눠 폭을 분할한다(J-62 — 묶음 안 최대 동시 수만큼).
// - 첫 스크롤 = 그 주 가장 이른 일정 1시간 전, 없으면 09:00.
// ----------------------------------------------------------------------
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { groupByDate } from '@/src/sections/schedules/utils/calendar-event';
import {
  addDays,
  formatMinutes,
  MINUTES_PER_DAY,
  parseDate,
  startOfWeek,
  WEEKDAY_LABELS,
  type DateParts,
} from '@/src/sections/schedules/utils/kst-calendar';
import { MSG_D08 } from '@/src/shared/messages/d08';

export const BLOCK_MIN_MINUTES = 30;
export const BLOCK_NO_END_MINUTES = 60;
export const DEFAULT_SCROLL_MINUTES = 9 * 60;
/** 빈 칸 단위 30분(J-60) */
export const SLOT_MINUTES = 30;

export interface WeekBlock {
  event: CalendarEvent;
  top: number;
  height: number;
  /** 0부터, columns 개 중 몇 번째 */
  column: number;
  columns: number;
  /** 자정을 넘으면 종료 'HH:mm' */
  overnightEnd: string | null;
}

export interface WeekSlot {
  minutes: number;
  /** "{M}월 {D}일 {HH:mm} 일정 추가" */
  ariaLabel: string;
}

export interface WeekDay {
  date: string;
  month: number;
  day: number;
  weekday: string;
  isToday: boolean;
  blocks: WeekBlock[];
  /** 빈 30분 칸 48개(J-60) */
  slots: WeekSlot[];
}

/** 시간 눈금 '00:00'~'23:00' */
export const HOUR_LABELS = Array.from({ length: 24 }, (_, h) =>
  formatMinutes(h * 60)
);

export function weekRange(anchor: string): { start: string; end: string } {
  const start = startOfWeek(anchor);
  return { start, end: addDays(start, 6) };
}

function blockSpan(event: CalendarEvent): {
  top: number;
  end: number;
  overnightEnd: string | null;
} {
  const top = event.startMinutes;
  let end: number;
  let overnightEnd: string | null = null;
  if (event.endDate === null || event.endMinutes === null)
    end = top + BLOCK_NO_END_MINUTES;
  else if (event.endDate === event.date) end = event.endMinutes;
  else {
    end = MINUTES_PER_DAY;
    overnightEnd = formatMinutes(event.endMinutes);
  }
  end = Math.min(MINUTES_PER_DAY, Math.max(end, top + BLOCK_MIN_MINUTES));
  return { top, end, overnightEnd };
}

/** 하루 블록 — 겹치는 묶음(클러스터)마다 탐욕적으로 열을 배정한다 */
export function layoutDay(events: CalendarEvent[]): WeekBlock[] {
  const spans = events
    .map((event) => ({ event, ...blockSpan(event) }))
    .sort((a, b) => a.top - b.top || b.end - a.end);
  const blocks: WeekBlock[] = [];
  let cluster: WeekBlock[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    const columns = columnEnds.length;
    for (const block of cluster) block.columns = columns;
    cluster = [];
    columnEnds = [];
  };

  for (const span of spans) {
    if (span.top >= clusterEnd) closeCluster();
    let column = columnEnds.findIndex((end) => end <= span.top);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(span.end);
    } else columnEnds[column] = span.end;
    const block: WeekBlock = {
      event: span.event,
      top: span.top,
      height: span.end - span.top,
      column,
      columns: 1,
      overnightEnd: span.overnightEnd,
    };
    cluster.push(block);
    blocks.push(block);
    clusterEnd = Math.max(clusterEnd, span.end);
  }
  closeCluster();
  return blocks;
}

export function buildWeek(params: {
  anchor: string;
  today: string;
  events: CalendarEvent[];
}): WeekDay[] {
  const { start } = weekRange(params.anchor);
  const byDate = groupByDate(params.events);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const p = parseDate(date) as DateParts;
    return {
      date,
      month: p.month,
      day: p.day,
      weekday: WEEKDAY_LABELS[i],
      isToday: date === params.today,
      blocks: layoutDay(byDate.get(date) ?? []),
      slots: Array.from(
        { length: MINUTES_PER_DAY / SLOT_MINUTES },
        (_, slot) => ({
          minutes: slot * SLOT_MINUTES,
          ariaLabel: MSG_D08.SLOT_ADD_ARIA(
            p.month,
            p.day,
            formatMinutes(slot * SLOT_MINUTES)
          ),
        })
      ),
    };
  });
}

/** 첫 세로 스크롤 위치(분) — 가장 이른 일정 1시간 전, 없으면 09:00 */
export function initialScrollMinutes(days: WeekDay[]): number {
  const tops = days.flatMap((d) => d.blocks.map((b) => b.top));
  if (tops.length === 0) return DEFAULT_SCROLL_MINUTES;
  return Math.max(0, Math.min(...tops) - 60);
}
