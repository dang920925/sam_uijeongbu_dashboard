// ----------------------------------------------------------------------
// 예매 목록 '초대한 사람' 필터(U41 §22.1 · design §17 SCR-D12) — 선택값 ↔ 목록 쿼리(순수 함수).
// 선택값: 'ALL' · 'SAM_RELATED' · 'STAFF_RELATED' · 'MEMBER:{단원 id}'.
// 배우 선택지는 집계(inviters)의 배우 묶음 — 이 공연에서 초대한 예매가 있는 배우만(가나다순).
// ----------------------------------------------------------------------
import type {
  ReservationListQuery,
  ReservationSummaryBoardResponse,
} from '@/src/types/booking';

const MEMBER_PREFIX = 'MEMBER:';

export function toInviterQuery(
  value: string
): Pick<ReservationListQuery, 'inviterKind' | 'inviterMemberId'> {
  if (value === 'SAM_RELATED' || value === 'STAFF_RELATED')
    return { inviterKind: value };
  if (value.startsWith(MEMBER_PREFIX)) {
    const id = value.slice(MEMBER_PREFIX.length);
    return id ? { inviterKind: 'MEMBER', inviterMemberId: id } : {};
  }
  return {};
}

export function toInviterFilterOptions(
  summary: Pick<ReservationSummaryBoardResponse, 'inviters'>
): { value: string; label: string }[] {
  return summary.inviters
    .filter((row) => row.kind === 'MEMBER' && row.memberId && row.name)
    .map((row) => ({
      value: `${MEMBER_PREFIX}${row.memberId}`,
      label: row.name as string,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'));
}
