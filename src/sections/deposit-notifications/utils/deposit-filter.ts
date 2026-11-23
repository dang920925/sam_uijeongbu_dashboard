// ----------------------------------------------------------------------
// '입금 알림' 탭 거르기 — 전체 + 판정 결과 6종(처리할 것: 확인 안 된 입금 · 확인 필요 · 일부 입금을 앞에).
// ----------------------------------------------------------------------
import type { SegmentOption } from '@/src/components/segment-pill';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';
import type { DepositNotificationStatus } from '@/src/types/deposit-notification';

export type DepositFilter = DepositNotificationStatus | 'ALL';

const ORDER: DepositNotificationStatus[] = [
  'UNMATCHED',
  'NEEDS_REVIEW',
  'PARTIAL',
  'AUTO_CONFIRMED',
  'MANUALLY_MATCHED',
  'IGNORED',
  'IGNORED_SOURCE',
];

export function depositFilterOptions(): SegmentOption<DepositFilter>[] {
  return [
    { value: 'ALL', label: MSG_DEP.FILTER_ALL },
    ...ORDER.map((status) => ({
      value: status,
      label: MSG_DEP.STATUS[status],
    })),
  ];
}

/** 쿼리의 status — 전체면 생략 */
export function toStatusQuery(
  filter: DepositFilter
): DepositNotificationStatus | undefined {
  return filter === 'ALL' ? undefined : filter;
}

/** 예매번호 입력 → 4자리 숫자면 그대로, 아니면 null */
export function toCodeQuery(input: string): string | null {
  const trimmed = input.trim();
  return /^[0-9]{4}$/.test(trimmed) ? trimmed : null;
}
