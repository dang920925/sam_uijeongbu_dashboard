// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기' 순수 함수(design §6.1a · designer §13.11).
// - 입력은 숫자만 4자리까지(inputmode numeric 이어도 붙여넣기·물리 키보드로 다른 글자가 들어올 수 있다).
// - 결과 줄: 주 "공연명 · M/D HH:mm" / 보조 "이름 · 일반 2 · 스태프 1"(시안 find-many).
// - 링크: 공연 id 를 알면 예매 관리 강조(paths.reservationFocus), 모르면 예매 관리 첫 화면.
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import {
  formatTierBreakdown,
  type Reservation,
} from '@/src/api/reservation-mapper';

export const CODE_LENGTH = 4;

/** DOM id — 입력 aria-controls·xs 닫을 때 포커스 복귀 */
export const QUICK_SEARCH_IDS = {
  input: 'quick-search-input',
  popup: 'quick-search-popup',
  openButton: 'quick-search-open',
} as const;

/** 입력값 → 숫자만, 최대 4자리 */
export function sanitizeCodeInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

/** "2099-12-12" + "14:00(:00)" → "12/12 14:00" */
export function formatShowShort(showDate: string, startTime: string): string {
  const [, month, day] = showDate.split('-');
  const time = startTime.slice(0, 5);
  if (!month || !day) return `${showDate} ${time}`.trim();
  return `${Number(month)}/${Number(day)} ${time}`;
}

export function resultPrimaryText(reservation: Reservation): string {
  const when = formatShowShort(reservation.showDate, reservation.startTime);
  return reservation.performanceTitle
    ? `${reservation.performanceTitle} · ${when}`
    : when;
}

export function resultSecondaryText(reservation: Reservation): string {
  const tiers = formatTierBreakdown(reservation.items);
  return tiers
    ? `${reservation.bookerName} · ${tiers}`
    : reservation.bookerName;
}

export function reservationFocusHref(reservation: Reservation): string {
  return reservation.performanceId
    ? paths.reservationFocus(reservation.performanceId, reservation.code)
    : paths.reservations;
}

export type QuickSearchOutcome = 'none' | 'one' | 'many';

export function outcomeOf(count: number): QuickSearchOutcome {
  if (count === 0) return 'none';
  return count === 1 ? 'one' : 'many';
}
