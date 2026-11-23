// ----------------------------------------------------------------------
// (U46) 시간 막기 폼(순수 함수) — 기본값 · 검증 · 요청 본문 · 목록 표시값. 서버와 같은 규칙(30분 단위, 30분~하루,
// WEEKLY 요일 1개 이상, 종료일 ≥ 시작일, 2년 이내). 반복 종료일은 필수이고 기본은 1년 뒤.
// ----------------------------------------------------------------------
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import type {
  RoomBlock,
  RoomBlockRepeat,
  RoomBlockRequest,
} from '@/src/types/practice';

export interface RoomBlockForm {
  title: string;
  memo: string;
  repeat: RoomBlockRepeat;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
}

export type RoomBlockFormErrors = Partial<
  Record<'title' | 'weekdays' | 'time' | 'dates', string>
>;

const DAY_MS = 86_400_000;
const MAX_SPAN_DAYS = 731;
const pad = (n: number) => String(n).padStart(2, '0');

/** 30분 칸 'HH:mm' — 시작 00:00~23:30, 끝 00:30~24:00 */
export const START_TIMES = Array.from(
  { length: 48 },
  (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`
);
export const END_TIMES = [...START_TIMES.slice(1), '24:00'];

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** 1년 뒤 같은 날(2/29 는 3/1) */
export function oneYearLater(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** ISO 요일(1=월 … 7=일) */
export function isoWeekdayOf(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function emptyRoomBlockForm(today: string): RoomBlockForm {
  return {
    title: '',
    memo: '',
    repeat: 'WEEKLY',
    weekdays: [isoWeekdayOf(today)],
    startTime: '10:00',
    endTime: '18:00',
    startDate: today,
    endDate: oneYearLater(today),
  };
}

export function toRoomBlockForm(block: RoomBlock): RoomBlockForm {
  return {
    title: block.title,
    memo: block.memo ?? '',
    repeat: block.repeat,
    weekdays: [...block.weekdays],
    startTime: block.startTime,
    endTime: block.endTime,
    startDate: block.startDate,
    endDate: block.endDate,
  };
}

export function validateRoomBlockForm(
  form: RoomBlockForm
): RoomBlockFormErrors {
  const errors: RoomBlockFormErrors = {};
  if (form.title.trim().length === 0) errors.title = MSG_BLOCKS.ERR_TITLE;
  if (form.repeat === 'WEEKLY' && form.weekdays.length === 0)
    errors.weekdays = MSG_BLOCKS.ERR_WEEKDAYS;
  if (toMinutes(form.endTime) - toMinutes(form.startTime) < 30)
    errors.time = MSG_BLOCKS.ERR_TIME;
  if (form.repeat === 'WEEKLY') {
    const span =
      (Date.parse(form.endDate) - Date.parse(form.startDate)) / DAY_MS;
    if (!form.endDate || Number.isNaN(span) || span < 0)
      errors.dates = MSG_BLOCKS.ERR_DATES;
    else if (span > MAX_SPAN_DAYS) errors.dates = MSG_BLOCKS.ERR_SPAN;
  }
  return errors;
}

export function toRoomBlockRequest(form: RoomBlockForm): RoomBlockRequest {
  const weekly = form.repeat === 'WEEKLY';
  const memo = form.memo.trim();
  return {
    title: form.title.trim(),
    memo: memo.length > 0 ? memo : null,
    repeat: form.repeat,
    weekdays: weekly ? [...form.weekdays].sort((a, b) => a - b) : [],
    startTime: form.startTime,
    endTime: form.endTime,
    startDate: form.startDate,
    endDate: weekly ? form.endDate : form.startDate,
  };
}

export interface RoomBlockRow {
  id: string;
  title: string;
  repeatText: string;
  timeText: string;
  periodText: string;
  skipText: string;
}

const dot = (date: string) => date.replaceAll('-', '.');

export function toRoomBlockRow(block: RoomBlock): RoomBlockRow {
  const days = [...block.weekdays]
    .sort((a, b) => a - b)
    .map((d) => MSG_BLOCKS.WEEKDAY_LABELS[d - 1])
    .join('·');
  return {
    id: block.id,
    title: block.title,
    repeatText:
      block.repeat === 'WEEKLY' ? MSG_BLOCKS.WEEKLY(days) : MSG_BLOCKS.ONCE,
    timeText: `${block.startTime}–${block.endTime}`,
    periodText:
      block.startDate === block.endDate
        ? dot(block.startDate)
        : `${dot(block.startDate)} – ${dot(block.endDate)}`,
    skipText:
      block.skipDates.length > 0
        ? block.skipDates.map((d) => d.slice(5).replace('-', '.')).join(', ')
        : MSG_BLOCKS.NO_SKIPS,
  };
}
