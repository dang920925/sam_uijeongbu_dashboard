// ----------------------------------------------------------------------
// 회차 고르기·표기 — 기본 회차 = `?showId=` → 기기에 기억한 회차 → 지금 시각과 가장 가까운 회차(design SCR-D13 ①).
// 회차 날짜·시각은 KST 달력 값(YYYY-MM-DD · HH:mm).
// ----------------------------------------------------------------------
import type { AdmissionShow } from '@/src/api/admission-mapper';

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' + 'HH:mm' → "12/12 14:00" */
export function formatShowWhen(showDate: string, startTime: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(showDate);
  const time = startTime.slice(0, 5);
  return m ? `${Number(m[1])}/${Number(m[2])} ${time}` : time;
}

/** 회차 시작 시각(ms) — KST 벽시계 */
export function showStartMs(
  show: Pick<AdmissionShow, 'showDate' | 'startTime'>
) {
  return Date.parse(`${show.showDate}T${show.startTime.slice(0, 5)}:00+09:00`);
}

export function pickShowId(
  shows: AdmissionShow[],
  options: { requested: string | null; stored: string | null; now: number }
): string | null {
  if (shows.length === 0) return null;
  const has = (id: string | null) =>
    id !== null && shows.some((show) => show.id === id);
  if (has(options.requested)) return options.requested;
  if (has(options.stored)) return options.stored;
  return shows.reduce((best, show) =>
    Math.abs(showStartMs(show) - options.now) <
    Math.abs(showStartMs(best) - options.now)
      ? show
      : best
  ).id;
}

/** 갱신 시각(ms) → KST "HH:mm" */
export function formatKstClock(ms: number): string {
  const d = new Date(ms + 9 * 60 * 60 * 1000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
