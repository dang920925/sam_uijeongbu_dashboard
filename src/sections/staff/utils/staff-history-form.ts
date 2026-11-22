// ----------------------------------------------------------------------
// 연출진 연혁 입력 줄(U28 — design §7 SCR-D09 · develop §12.2) 순수 함수.
// 줄 = 연도(4자리, 1900~2100) · 내용(1~200) · 순서(▲▼). 최대 50줄. 배열 순서가 곧 표시 순서.
// ----------------------------------------------------------------------
import type { StaffHistoryItem } from '@/src/types/content';

export const STAFF_HISTORY_MAX = 50;
export const STAFF_HISTORY_CONTENT_MAX = 200;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

export interface StaffHistoryRow {
  key: string;
  year: string;
  content: string;
}

let seq = 0;
const makeKey = () => `history-${++seq}`;

export function emptyHistoryRow(): StaffHistoryRow {
  return { key: makeKey(), year: '', content: '' };
}

export function toHistoryRows(
  histories: readonly StaffHistoryItem[] | undefined
): StaffHistoryRow[] {
  return (histories ?? []).map((h) => ({
    key: makeKey(),
    year: String(h.year),
    content: h.content,
  }));
}

/** 줄 하나를 위(-1)·아래(+1)로 옮긴다. 끝이면 그대로 */
export function moveHistoryRow(
  rows: readonly StaffHistoryRow[],
  key: string,
  direction: -1 | 1
): StaffHistoryRow[] {
  const index = rows.findIndex((row) => row.key === key);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return [...rows];
  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** 줄마다 잘못됐는지(연도 형식·범위, 내용 비었음·200자 초과) */
export function invalidHistoryRows(
  rows: readonly StaffHistoryRow[]
): boolean[] {
  return rows.map((row) => {
    const year = Number(row.year);
    const content = row.content.trim();
    return (
      !/^\d{4}$/.test(row.year.trim()) ||
      year < YEAR_MIN ||
      year > YEAR_MAX ||
      content === '' ||
      content.length > STAFF_HISTORY_CONTENT_MAX
    );
  });
}

export function toHistoryRequest(
  rows: readonly StaffHistoryRow[]
): StaffHistoryItem[] {
  return rows.map((row) => ({
    year: Number(row.year.trim()),
    content: row.content.trim(),
  }));
}
