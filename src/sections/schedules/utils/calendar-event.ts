// ----------------------------------------------------------------------
// 일정 → 캘린더 공통 표시 모델(순수 함수). 월 칩·주 블록·아젠다 행·상세가 같이 쓴다.
// - 묶기 기준 = startAt 의 KST 날짜, 하루 안은 시작 시각 오름차순(같으면 id 오름차순 — develop FN-15 U23 3).
// - 달마다 받은 결과를 합치므로(J-59) placeholder 로 같은 일정이 두 번 올 수 있다 → id 로 한 번만.
// - 여러 날 일정은 시작일에만 그린다(J-25), 시간 글자는 "{HH:mm} – {YYYY.MM.DD HH:mm}".
// ----------------------------------------------------------------------
import {
  formatMinutes,
  toKstMoment,
} from '@/src/sections/schedules/utils/kst-calendar';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { SCHEDULE_TYPE_LABEL, type ScheduleType } from '@/src/types/codes';
import type { Schedule } from '@/src/types/content';
import { formatKstDateTime } from '@/src/utils/kst-date-format';

/** 연습실 예약 레이어(v1.3.1 사용자 요청) 칩의 원본 정보 */
export interface RoomEventInfo {
  id: string;
  teamName: string;
  memo: string | null;
  performanceTitle: string;
  /** (U45) 팀이 체크한 참석자 이름 */
  attendeeNames: string[];
}

export interface CalendarEvent {
  /** 일정 id · 연습실 예약은 `room:{id}`(일정 id 와 겹치지 않게) */
  id: string;
  /** schedule = 공식 일정 · room = 팀 연습실 예약(빗금 — 공식 일정 아님) */
  kind: 'schedule' | 'room';
  /** kind room 일 때만 */
  room: RoomEventInfo | null;
  title: string;
  type: ScheduleType;
  typeLabel: string;
  /** 시작 KST 날짜 'YYYY-MM-DD' */
  date: string;
  startMinutes: number;
  /** 종료 KST 날짜·분(없으면 null) */
  endDate: string | null;
  endMinutes: number | null;
  /** 'HH:mm' */
  startTime: string;
  /** "HH:mm – HH:mm" · 종료 없음 "HH:mm" · 다른 날 "HH:mm – YYYY.MM.DD HH:mm" */
  timeText: string;
  location: string | null;
  isCancelled: boolean;
  cancelReason: string | null;
  ariaLabel: string;
}

export function toCalendarEvent(schedule: Schedule): CalendarEvent | null {
  const start = toKstMoment(schedule.startAt);
  if (!start) return null;
  const end = schedule.endAt ? toKstMoment(schedule.endAt) : null;
  const startTime = formatMinutes(start.minutes);
  let timeText = startTime;
  if (end && end.date === start.date)
    timeText = MSG_D08.TIME_RANGE(startTime, formatMinutes(end.minutes));
  else if (end && schedule.endAt)
    timeText = MSG_D08.TIME_RANGE(startTime, formatKstDateTime(schedule.endAt));
  const [, month, day] = start.date.split('-').map(Number);
  const typeLabel = SCHEDULE_TYPE_LABEL[schedule.type];
  const isCancelled = schedule.status === 'CANCELLED';
  return {
    id: schedule.id,
    kind: 'schedule',
    room: null,
    title: schedule.title,
    type: schedule.type,
    typeLabel,
    date: start.date,
    startMinutes: start.minutes,
    endDate: end?.date ?? null,
    endMinutes: end?.minutes ?? null,
    startTime,
    timeText,
    location: schedule.location?.trim() ? schedule.location : null,
    isCancelled,
    cancelReason: isCancelled ? schedule.cancelReason : null,
    ariaLabel: MSG_D08.EVENT_ARIA(
      typeLabel,
      schedule.title,
      month,
      day,
      timeText,
      isCancelled
    ),
  };
}

export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** 중복 id 제거 + 날짜·시각·id 오름차순 */
export function toCalendarEvents(items: Schedule[]): CalendarEvent[] {
  const seen = new Set<string>();
  const events: CalendarEvent[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const event = toCalendarEvent(item);
    if (event) events.push(event);
  }
  return events.sort(compareEvents);
}

/** KST 날짜별 묶음(입력 순서 유지 — toCalendarEvents 결과를 넣으면 하루 안 오름차순) */
export function groupByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date);
    if (list) list.push(event);
    else map.set(event.date, [event]);
  }
  return map;
}
