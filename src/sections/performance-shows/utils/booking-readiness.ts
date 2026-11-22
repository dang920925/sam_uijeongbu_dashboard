// ----------------------------------------------------------------------
// 준비 상태 알림(design §6 SCR-D11 콘텐츠 1 · §6.1b) — missingFields(계약 필드명) → 한국어 항목.
// - 공연 단위 항목: 예매 설정 빈 칸(예매 설정 응답) + `publicTier`(사용 중 PUBLIC 등급 없음 — 회차 응답에 섞여 옴)는
//   한 번만, 회차 필드는 회차마다 세어 "예매 오픈 시각(회차 4개)"(designer 시안 not-ready 순서).
// - publicTier 인데 사용 중 링크 전용 등급이 있으면 경고 항목이 아니다 — 다른 빈 칸이 없으면
//   info "링크로 들어온 사람만 예매할 수 있습니다."(design §6.1b · develop §11.10 J-73).
// - 회차가 없으면 알림을 숨긴다(designer §13.7.3 1.4 empty — 회차 0 이면 info 문구가 거짓, §13.5 6 사용자 확인 대상).
// - 모르는 필드 이름은 이름 그대로 보인다(감추지 않음).
// ----------------------------------------------------------------------
import { MSG_D11 } from '@/src/shared/messages/d11';

/** develop §11.3 state ① 의 공연 설정 필드(계약 순서) */
export const POLICY_FIELDS = [
  'depositBank',
  'depositAccountNumber',
  'depositAccountHolder',
  'maxTicketsPerBooking',
  'depositDeadlineHours',
  'refundPolicyText',
] as const;

/** 회차 응답에 오지만 공연 단위인 필드 */
const PUBLIC_TIER = 'publicTier';

/** 회차 필드 표시 순서 */
const SHOW_FIELD_ORDER = ['totalSeats', 'bookingOpenAt', 'seatMap'];

export interface ReadinessNotice {
  tone: 'warning' | 'info';
  message: string;
}

const isPerformanceField = (field: string) =>
  field === PUBLIC_TIER || (POLICY_FIELDS as readonly string[]).includes(field);

const labelOf = (labels: Record<string, string>, field: string) =>
  labels[field] ?? field;

/** 회차 한 개의 빈 회차 필드(공연 단위 필드 제외) — 표시 순서로 */
export function showOnlyMissingFields(missingFields: string[]): string[] {
  const own = missingFields.filter((field) => !isPerformanceField(field));
  const rank = (field: string) => {
    const index = SHOW_FIELD_ORDER.indexOf(field);
    return index === -1 ? SHOW_FIELD_ORDER.length : index;
  };
  return [...new Set(own)].sort((a, b) => rank(a) - rank(b));
}

/** 회차 행 "빈 칸: 오픈 시각" — 없으면 null */
export function toRowMissingText(missingFields: string[]): string | null {
  const fields = showOnlyMissingFields(missingFields);
  if (fields.length === 0) return null;
  return MSG_D11.ROW_MISSING(
    fields
      .map((field) => labelOf(MSG_D11.ROW_MISSING_LABEL, field))
      .join(MSG_D11.LIST_SEPARATOR)
  );
}

export function buildReadinessNotice(
  policyMissingFields: string[],
  showsMissingFields: string[][],
  hasActiveLinkOnlyTier: boolean
): ReadinessNotice | null {
  if (showsMissingFields.length === 0) return null;
  const policyItems = POLICY_FIELDS.filter((field) =>
    policyMissingFields.includes(field)
  ).map((field) => labelOf(MSG_D11.MISSING_LABEL, field));

  const noPublicTier = showsMissingFields.some((fields) =>
    fields.includes(PUBLIC_TIER)
  );
  const tierItems =
    noPublicTier && !hasActiveLinkOnlyTier
      ? [labelOf(MSG_D11.MISSING_LABEL, PUBLIC_TIER)]
      : [];

  const counts = new Map<string, number>();
  for (const fields of showsMissingFields) {
    for (const field of showOnlyMissingFields(fields)) {
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }
  const showItems = showOnlyMissingFields([...counts.keys()]).map((field) =>
    MSG_D11.NOTICE_SHOW_COUNT(
      labelOf(MSG_D11.MISSING_LABEL, field),
      counts.get(field) ?? 0
    )
  );

  const items = [...policyItems, ...tierItems, ...showItems];
  if (items.length > 0) {
    return {
      tone: 'warning',
      message: MSG_D11.NOTICE_MISSING(items.join(MSG_D11.LIST_SEPARATOR)),
    };
  }
  return {
    tone: 'info',
    message: noPublicTier ? MSG_D11.NOTICE_LINK_ONLY : MSG_D11.NOTICE_READY,
  };
}
