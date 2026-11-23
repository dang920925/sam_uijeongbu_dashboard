// ----------------------------------------------------------------------
// R2 입금 알림 매퍼 — 서버 응답 → '입금 알림' 탭 표시 모델.
// - 판정 라벨·색: 입금 완료·직접 연결(success) · 일부 입금·확인 필요(warning) · 확인 안 된 입금(error) · 무시함(neutral)
// - 출처 앱: appName, 없으면 패키지 이름을 앱 이름으로(카카오뱅크 · 알림톡 · 카카오페이), 모르면 받은 값 그대로
// - 문구 시험 이유: 확인 필요 이유, 불일치면 단서("입금자명 불일치(예매번호만 일치)")
// - 일부 입금: 예매가 입금 대기이고 받은 금액 < 예매 금액이면 "받은 금액 N원 / M원"
// - 처리(연결·무시)는 일부 입금·확인 필요·확인 안 된 입금에서만
// ----------------------------------------------------------------------
import { formatWon } from '@/src/api/reservation-mapper';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';
import type { LabelTone } from '@/src/theme/semantic';
import type {
  DepositNotificationItem,
  DepositNotificationStatus,
  DepositPreview,
  DepositReservationSummary,
} from '@/src/types/deposit-notification';
import { formatKstDateTime } from '@/src/utils/kst-date-format';

const OPEN_STATUSES: DepositNotificationStatus[] = [
  'PARTIAL',
  'NEEDS_REVIEW',
  'UNMATCHED',
];

export const DEPOSIT_STATUS_TONE: Record<DepositNotificationStatus, LabelTone> =
  {
    AUTO_CONFIRMED: 'success',
    MANUALLY_MATCHED: 'success',
    PARTIAL: 'warning',
    NEEDS_REVIEW: 'warning',
    UNMATCHED: 'error',
    IGNORED: 'neutral',
    IGNORED_SOURCE: 'neutral',
  };

export interface DepositReservationView {
  id: string;
  code: string;
  /** "1234 · 홍길동1234 · fixture 공연" */
  text: string;
  /** 입금 대기이고 받은 금액이 모자라면 "받은 금액 N원 / M원" */
  partialText: string | null;
}

export interface DepositRow {
  id: string;
  receivedText: string;
  /** 출처 앱 이름 — appName, 없으면 패키지·source 를 앱 이름으로 */
  appText: string | null;
  /** 제목 + 내용(줄바꿈) */
  messageText: string;
  amountText: string;
  status: DepositNotificationStatus;
  statusLabel: string;
  statusTone: LabelTone;
  reasonText: string | null;
  reservation: DepositReservationView | null;
  canResolve: boolean;
}

export function toSourceText(source: string | null): string | null {
  if (!source) return null;
  const lower = source.toLowerCase();
  if (lower.includes('kakaobank') || source.includes('카카오뱅크'))
    return MSG_DEP.SOURCE.KAKAOBANK;
  if (lower.includes('kakaopay') || source.includes('카카오페이'))
    return MSG_DEP.SOURCE.KAKAOPAY;
  if (lower.includes('com.kakao.talk') || source.includes('카카오톡'))
    return MSG_DEP.SOURCE.KAKAOTALK;
  return source;
}

export function toAmountText(amount: number | null): string {
  return amount === null ? MSG_DEP.AMOUNT_UNKNOWN : formatWon(amount);
}

/** 입금 대기이고 0 < 받은 금액 < 예매 금액이면 일부 입금 문구 */
export function toPartialText(input: {
  status: string;
  amount: number;
  receivedAmount: number;
}): string | null {
  if (input.status !== 'PENDING') return null;
  if (input.receivedAmount <= 0 || input.receivedAmount >= input.amount)
    return null;
  return MSG_DEP.RECEIVED_OF(
    formatWon(input.receivedAmount),
    formatWon(input.amount)
  );
}

export function toDepositReservationView(
  reservation: DepositReservationSummary
): DepositReservationView {
  const parts = [
    reservation.code,
    reservation.depositorName,
    reservation.performanceTitle,
  ].filter((part): part is string => Boolean(part));
  return {
    id: reservation.id,
    code: reservation.code,
    text: parts.join(' · '),
    partialText: toPartialText(reservation),
  };
}

export function toDepositRow(item: DepositNotificationItem): DepositRow {
  return {
    id: item.id,
    receivedText: formatKstDateTime(item.receivedAt),
    appText:
      item.appName?.trim() || toSourceText(item.appPackage ?? item.source),
    messageText: [item.title, item.text]
      .filter((part): part is string => Boolean(part))
      .join('\n'),
    amountText: toAmountText(item.parsedAmount),
    status: item.status,
    statusLabel: MSG_DEP.STATUS[item.status],
    statusTone: DEPOSIT_STATUS_TONE[item.status],
    reasonText: item.reviewReason
      ? MSG_DEP.REASON[item.reviewReason]
      : item.status === 'IGNORED_SOURCE'
        ? MSG_DEP.IGNORED_SOURCE_REASON
        : null,
    reservation: item.reservation
      ? toDepositReservationView(item.reservation)
      : null,
    canResolve: OPEN_STATUSES.includes(item.status),
  };
}

export interface DepositPreviewView {
  amountText: string;
  candidatesText: string;
  matchedByText: string;
  statusLabel: string;
  statusTone: LabelTone;
  reasonText: string | null;
  matches: DepositReservationView[];
}

export function toDepositPreviewView(
  preview: DepositPreview
): DepositPreviewView {
  return {
    amountText: toAmountText(preview.amount),
    candidatesText:
      preview.amountCandidates.length > 0
        ? preview.amountCandidates.map(formatWon).join(', ')
        : MSG_DEP.NO_RESERVATION,
    matchedByText:
      MSG_DEP.PREVIEW_MATCHED_BY_VALUE[preview.matchedBy ?? 'NONE'],
    statusLabel: MSG_DEP.STATUS[preview.status],
    statusTone: DEPOSIT_STATUS_TONE[preview.status],
    reasonText: preview.reviewReason
      ? MSG_DEP.REASON[preview.reviewReason]
      : preview.unmatchedHint
        ? MSG_DEP.HINT[preview.unmatchedHint]
        : null,
    matches: preview.matches.map(toDepositReservationView),
  };
}

/** 예매 목록의 '일부 입금' 표시용 — 예매 id → 받은 금액 */
export function toReceivedAmountMap(
  items: { reservationId: string; receivedAmount: number }[]
): Map<string, number> {
  return new Map(
    items.map((item) => [item.reservationId, item.receivedAmount])
  );
}
