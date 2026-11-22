// ----------------------------------------------------------------------
// R2 입금 알림 계약 — server `/admin/deposit-notifications*`(서버 dto 와 같은 모양, server test/contract/deposit-notifications.contract.ts).
// 사용자 결정 2026-11-23 판정표: 자동 확정 · 일부 입금 · 확인 필요 · 확인 안 된 입금 + 관리자 연결·무시.
// ----------------------------------------------------------------------
import type { Paginated } from '@/src/types/common';

export const DEPOSIT_NOTIFICATION_STATUSES = [
  'AUTO_CONFIRMED',
  'PARTIAL',
  'NEEDS_REVIEW',
  'UNMATCHED',
  'MANUALLY_MATCHED',
  'IGNORED',
] as const;
export type DepositNotificationStatus =
  (typeof DEPOSIT_NOTIFICATION_STATUSES)[number];

export type DepositReviewReason =
  | 'MULTIPLE_MATCH'
  | 'OVERPAID'
  | 'AMOUNT_UNREADABLE'
  | 'AUTO_CONFIRM_OFF'
  | 'NOT_PENDING';

/** 연결된(또는 후보) 예매 요약 */
export interface DepositReservationSummary {
  id: string;
  code: string;
  performanceId: string;
  performanceTitle: string;
  depositorName: string | null;
  amount: number;
  /** 입금 알림으로 받은 금액 합 */
  receivedAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  version: number;
}

/** GET /admin/deposit-notifications 항목 */
export interface DepositNotificationItem {
  id: string;
  receivedAt: string;
  source: string | null;
  title: string | null;
  /** 잔액 숫자는 서버가 지운 본문 */
  text: string | null;
  parsedAmount: number | null;
  status: DepositNotificationStatus;
  reviewReason: DepositReviewReason | null;
  resolvedAt: string | null;
  reservation: DepositReservationSummary | null;
}

export type DepositNotificationPage = Paginated<DepositNotificationItem>;

export interface DepositNotificationListQuery {
  status?: DepositNotificationStatus;
  page: number;
  size: number;
}

/** POST /admin/deposit-notifications/preview */
export interface DepositPreviewRequest {
  title?: string;
  text: string;
}

export interface DepositPreview {
  text: string;
  amount: number | null;
  amountCandidates: number[];
  matchedBy: 'DEPOSITOR' | 'CODE' | null;
  status: Exclude<DepositNotificationStatus, 'MANUALLY_MATCHED' | 'IGNORED'>;
  reviewReason: DepositReviewReason | null;
  autoConfirm: boolean;
  matches: DepositReservationSummary[];
}

/** POST /admin/deposit-notifications/{id}/match */
export interface DepositMatchRequest {
  reservationId: string;
  version: number;
}

/** GET /admin/deposit-notifications/received-amounts?performanceId */
export interface DepositReceivedAmounts {
  items: { reservationId: string; receivedAmount: number }[];
}
