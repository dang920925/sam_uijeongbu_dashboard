// ----------------------------------------------------------------------
// (U40) 메뉴 숫자 배지 표시 — 0 이하·숫자 아님이면 숨김(null), 99 초과는 "99+"(지휘자 명세 2026-11-20).
// 이름(aria)은 실제 숫자 그대로 — "입금 대기 120건"(보이는 글자만 99+ 로 줄인다).
// ----------------------------------------------------------------------
import { MSG_D00 } from '@/src/shared/messages/d00';

export const NAV_BADGE_MAX = 99;

/** 메뉴 배지가 붙는 자리 */
export type NavBadgeKey = 'reservations' | 'applications';

export interface NavBadgeView {
  text: string;
  label: string;
}

const LABELS: Record<NavBadgeKey, (count: number) => string> = {
  reservations: MSG_D00.NAV_BADGE_RESERVATIONS,
  applications: MSG_D00.NAV_BADGE_APPLICATIONS,
};

export function toNavBadge(
  key: NavBadgeKey,
  count: number | undefined
): NavBadgeView | null {
  if (count === undefined || !Number.isFinite(count) || count <= 0) return null;
  const n = Math.floor(count);
  return {
    text: n > NAV_BADGE_MAX ? MSG_D00.NAV_BADGE_OVERFLOW : String(n),
    label: LABELS[key](n),
  };
}
