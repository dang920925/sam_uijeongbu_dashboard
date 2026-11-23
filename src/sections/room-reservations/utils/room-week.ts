// ----------------------------------------------------------------------
// 연습실 예약 목록 주 계산·표시값(순수 함수, KST 고정). 주는 월요일 시작.
// ----------------------------------------------------------------------
import { formatAttendees } from '@/src/api/practice-mapper';
import type { AdminRoomReservation } from '@/src/types/practice';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');

function kst(instant: Date): Date {
  return new Date(instant.getTime() + KST_OFFSET_MS);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** 순간 → KST 'YYYY-MM-DD' */
export function kstDateOf(instant: Date): string {
  return kst(instant).toISOString().slice(0, 10);
}

/** 그 날짜가 들어 있는 주의 월요일 */
export function weekStartOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

/** [월 00:00, 다음 월 00:00) KST → ISO */
export function weekRange(weekStart: string): { from: string; to: string } {
  const start = Date.parse(`${weekStart}T00:00:00+09:00`);
  return {
    from: new Date(start).toISOString(),
    to: new Date(start + 7 * DAY_MS).toISOString(),
  };
}

export function formatWeekTitle(weekStart: string): string {
  const end = addDays(weekStart, 6);
  return `${weekStart.replaceAll('-', '.')} – ${end.slice(5).replace('-', '.')}`;
}

export interface RoomRowDisplay {
  id: string;
  dateText: string;
  timeText: string;
  teamName: string;
  performanceTitle: string;
  memo: string;
  /** (U45) "2명 · 김가, 이나" · 없으면 대체 문구 */
  attendeesText: string;
}

/** 표 한 줄 — 'MM.DD (요일)' · 'HH:mm–HH:mm' · 참석자(U45) */
export function toRoomRowDisplay(
  r: AdminRoomReservation,
  noMemo: string,
  noAttendees: string
): RoomRowDisplay {
  const start = kst(r.startAt);
  const end = kst(r.endAt);
  return {
    id: r.id,
    dateText: `${pad(start.getUTCMonth() + 1)}.${pad(start.getUTCDate())} (${WEEKDAYS[start.getUTCDay()]})`,
    timeText: `${pad(start.getUTCHours())}:${pad(start.getUTCMinutes())}–${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
    teamName: r.teamName,
    performanceTitle: r.performanceTitle,
    memo: r.memo ?? noMemo,
    attendeesText: formatAttendees(r.attendeeNames, noAttendees),
  };
}
