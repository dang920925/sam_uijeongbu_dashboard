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
  'IGNORED_SOURCE',
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
  /** 알림 앱 패키지·이름(MacroDroid %not_app_package · %not_app_name) */
  appPackage: string | null;
  appName: string | null;
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
  /** 입금자명 전체 일치만 인정 */
  matchedBy: 'DEPOSITOR' | null;
  /** 불일치 단서 — 예매번호만 · 이름만 */
  unmatchedHint: 'CODE_ONLY' | 'NAME_ONLY' | null;
  status: Exclude<
    DepositNotificationStatus,
    'MANUALLY_MATCHED' | 'IGNORED' | 'IGNORED_SOURCE'
  >;
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
