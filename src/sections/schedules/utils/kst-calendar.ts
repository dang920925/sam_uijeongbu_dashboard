// ----------------------------------------------------------------------
// KST 달력 계산(순수 함수) — 날짜는 'YYYY-MM-DD'(KST 달력 날짜) 문자열로 다룬다.
// Date 의 로컬 getter 를 쓰지 않는다(UTC getter + 9시간 — 실행 TZ 와 무관, develop FN-15 U23 3).
// 출처: 홈페이지 client `src/sections/schedule/utils/kst-date.ts` 규칙을 옮겨 씀(저장소가 달라 공용 불가 — S-code-31).
// ----------------------------------------------------------------------
import type { YearMonth } from '@/src/api/schedule-queries';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const MINUTES_PER_DAY = 24 * 60;

/** 일요일 첫 열 순서의 요일 글자(현행 DAY_LABEL 과 같은 글자) */
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** 일정 시각의 KST 날짜와 하루 안 분(0~1439) */
export interface KstMoment {
  date: string;
  minutes: number;
}

export function toKstMoment(iso: string): KstMoment | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const d = new Date(time + KST_OFFSET_MS);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/** 'YYYY-MM-DD' 가 실제 있는 날짜면 부분값, 아니면 null */
export function parseDate(date: string | null | undefined): DateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

function fromUtcDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toUtcDate(date: string): Date {
  const p = parseDate(date) as DateParts;
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}

export function toDateString(year: number, month: number, day: number) {
  return fromUtcDate(new Date(Date.UTC(year, month - 1, day)));
}

export function addDays(date: string, days: number): string {
  return fromUtcDate(new Date(toUtcDate(date).getTime() + days * DAY_MS));
}

/** 0 = 일요일 */
export function dayOfWeek(date: string): number {
  return toUtcDate(date).getUTCDay();
}

export function startOfWeek(date: string): string {
  return addDays(date, -dayOfWeek(date));
}

export function firstOfMonth(date: string): string {
  const p = parseDate(date) as DateParts;
  return toDateString(p.year, p.month, 1);
}

/** 그 달 1일에서 n달 이동한 달의 1일(연도 넘김 포함) */
export function addMonths(date: string, months: number): string {
  const p = parseDate(date) as DateParts;
  return toDateString(p.year, p.month + months, 1);
}

export function lastOfMonth(date: string): string {
  return addDays(addMonths(date, 1), -1);
}

/** start~end(포함)가 걸치는 달들 */
export function monthsBetween(start: string, end: string): YearMonth[] {
  const months: YearMonth[] = [];
  let cursor = firstOfMonth(start);
  while (cursor <= end) {
    const p = parseDate(cursor) as DateParts;
    months.push({ year: p.year, month: p.month });
    cursor = addMonths(cursor, 1);
  }
  return months;
}

/** 분 → 'HH:mm' (1440 이상은 다음 날로 접는다) */
export function formatMinutes(minutes: number): string {
  const m = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** 두 KST 날짜 사이 일수(b − a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / DAY_MS);
}
