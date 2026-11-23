// ----------------------------------------------------------------------
// 연습실 예약 레이어(v1.3.1 사용자 요청 — design §13) — 팀 연습실 예약 → 캘린더 표시 모델(순수 함수).
// - 공식 일정과 같은 CalendarEvent 모양(kind 'room', id `room:{예약 id}`)이라 월 칩·주 블록·아젠다·더보기가 그대로 그린다.
// - 칩 글자 "{팀 이름} 연습실"(예: "Dear-B 연습실"), 유형 글자 "연습실 예약". 홈페이지 공개 일정·참관 슬롯과는 무관하다.
// - 조회 기간(관리 API ≤31일): 월 = 그 달 1일 00:00 ~ 다음 달 1일(KST), 주 = 주 시작 ~ +7일, 목록 = 오늘 ~ +30일.
// ----------------------------------------------------------------------
import {
  addDays,
  addMonths,
  firstOfMonth,
  formatMinutes,
  startOfWeek,
  toKstMoment,
} from '@/src/sections/schedules/utils/kst-calendar';
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import type { CalendarView } from '@/src/sections/schedules/utils/calendar-nav';
import { MSG_D08 } from '@/src/shared/messages/d08';
import type { AdminRoomReservation } from '@/src/types/practice';

export const ROOM_EVENT_PREFIX = 'room:';

/** 목록 보기에서 보여 줄 앞으로의 날 수(관리 API 31일 한도 안) */
export const ROOM_LIST_DAYS = 30;

export const isRoomEventId = (id: string) => id.startsWith(ROOM_EVENT_PREFIX);
export const roomIdOf = (eventId: string) =>
  eventId.slice(ROOM_EVENT_PREFIX.length);

const kstStart = (date: string) => `${date}T00:00:00+09:00`;

/** 보기별 연습실 예약 조회 기간(ISO, KST 자정 기준) */
export function roomRangeFor(
  view: CalendarView,
  anchor: string,
  today: string
): { from: string; to: string } {
  if (view === 'week') {
    const start = startOfWeek(anchor);
    return { from: kstStart(start), to: kstStart(addDays(start, 7)) };
  }
  if (view === 'list')
    return {
      from: kstStart(today),
      to: kstStart(addDays(today, ROOM_LIST_DAYS)),
    };
  const first = firstOfMonth(anchor);
  return { from: kstStart(first), to: kstStart(addMonths(first, 1)) };
}

export function toRoomCalendarEvent(
  room: AdminRoomReservation
): CalendarEvent | null {
  const start = toKstMoment(room.startAt.toISOString());
  const end = toKstMoment(room.endAt.toISOString());
  if (!start || !end) return null;
  const startTime = formatMinutes(start.minutes);
  const timeText = MSG_D08.TIME_RANGE(startTime, formatMinutes(end.minutes));
  const title = MSG_D08.ROOM_CHIP(room.teamName);
  const [, month, day] = start.date.split('-').map(Number);
  return {
    id: `${ROOM_EVENT_PREFIX}${room.id}`,
    kind: 'room',
    room: {
      id: room.id,
      teamName: room.teamName,
      memo: room.memo,
      performanceTitle: room.performanceTitle,
      attendeeNames: room.attendeeNames,
    },
    title,
    type: 'PRACTICE',
    typeLabel: MSG_D08.ROOM_LAYER,
    date: start.date,
    startMinutes: start.minutes,
    endDate: end.date,
    endMinutes: end.minutes,
    startTime,
    timeText,
    location: null,
    isCancelled: false,
    cancelReason: null,
    ariaLabel: MSG_D08.ROOM_ARIA(title, month, day, timeText),
  };
}

export function toRoomCalendarEvents(
  rooms: readonly AdminRoomReservation[]
): CalendarEvent[] {
  return rooms
    .map(toRoomCalendarEvent)
    .filter((event): event is CalendarEvent => event !== null);
}
