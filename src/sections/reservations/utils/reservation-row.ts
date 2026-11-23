// ----------------------------------------------------------------------
// D12 예매 표·카드 행 표시 모델(designer §13.7.3 2.1 · 보강2 11.2):
// 예매번호 · 예매자(이름 + 연락처/"연락처 없음") · 회차 "12.12 14:00" · 등급별 매수 + "총 n매" ·
// 금액(+ "직접 입력") / 입금자명 · 상태(+ 무료 · 관리자 등록 · 기한 · 취소 사유) · 입장 a/q · 초대 · 메모.
// 처리: 입금 대기 = 입금 확인·취소 / 확정 = 확인 취소·취소(입장 > 0 이면 잠금 — RSV_009 미리 막음) / 취소 = 되살리기.
// §6.1a 정확 일치: 검색어가 예매번호와 같으면 그 행을 맨 위로(나머지는 서버 순서 그대로).
// ----------------------------------------------------------------------
import {
  formatShowSlot,
  formatTierBreakdown,
  formatWon,
  toReservationCode,
  type Reservation,
} from '@/src/api/reservation-mapper';
import {
  admissionTextOf,
  appliedPriceTextOf,
  inviterTextOf,
  isFreeReservation,
} from '@/src/components/reservation-detail-drawer/reservation-detail-fields';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import { toSeatText } from '@/src/api/seat-map-mapper';
import { CANCEL_REASON_LABEL } from '@/src/types/codes';
import { formatKstDateTime } from '@/src/utils/kst-date-format';
import { formatPhone } from '@/src/utils/phone-format';

const dash = MSG_COMMON.EMPTY_VALUE;

export interface ReservationRow {
  id: string;
  code: string;
  bookerName: string;
  phoneText: string;
  showText: string;
  tierText: string;
  /** 링크 전용(할인) 등급 줄이 있는가 — info Label */
  hasDiscount: boolean;
  totalQtyText: string;
  amountText: string;
  isAmountOverridden: boolean;
  depositorText: string;
  status: Reservation['status'];
  deadlinePassed: boolean;
  confirmedBy: Reservation['confirmedBy'];
  isFree: boolean;
  isAdmin: boolean;
  /** 입금 대기 "기한 MM.DD HH:mm"(기한 지남이면 null — Label 이 알린다) · 취소 사유 */
  statusNote: string | null;
  admissionText: string;
  inviterText: string;
  /** U41 — 초대한 사람 구분(SAM 관계자 Label 강조) · 적용 가격 "1매 n원"(없으면 null) */
  inviterKind: NonNullable<Reservation['inviter']>['kind'] | null;
  appliedPriceText: string | null;
  /** U35 좌석 "B3·B4" · 좌석 지정 공연인데 없으면 "좌석 미정" · 아니면 null(칸 '-') */
  seatText: string | null;
  /** 좌석 변경 가능(좌석 지정 공연 · 취소 아님) */
  canChangeSeats: boolean;
  hasMemo: boolean;
  /** 입장 인원 있는 확정 건 — 확인 취소·취소 비활성 */
  isLocked: boolean;
  canEditItems: boolean;
}

/** "2099.12.12 14:00" → "12.12 14:00"(표 칸 폭 — designer 보강2) */
function shortDue(iso: string | null): string | null {
  const text = formatKstDateTime(iso);
  return text === dash ? null : text.slice(5);
}

export function toReservationRow(
  r: Reservation,
  seatSelection: boolean | null = null
): ReservationRow {
  let statusNote: string | null = null;
  if (r.status === 'PENDING' && !r.deadlinePassed) {
    const due = shortDue(r.depositDueAt);
    statusNote = due ? MSG_D12.DUE(due) : null;
  } else if (r.status === 'CANCELLED' && r.cancelReason) {
    statusNote = CANCEL_REASON_LABEL[r.cancelReason];
  }
  return {
    id: r.id,
    code: r.code,
    bookerName: r.bookerName,
    phoneText: formatPhone(r.bookerPhone) ?? MSG_D12.NO_PHONE,
    showText: formatShowSlot(r.showDate, r.startTime),
    tierText: formatTierBreakdown(r.items) || dash,
    hasDiscount: r.items.some((line) => line.visibility === 'LINK_ONLY'),
    totalQtyText: MSG_D12.TOTAL_QTY(r.quantity),
    amountText: formatWon(r.amount),
    isAmountOverridden: r.amountOverridden,
    depositorText: r.depositorName ?? dash,
    status: r.status,
    deadlinePassed: r.deadlinePassed,
    confirmedBy: r.confirmedBy,
    isFree: isFreeReservation(r),
    isAdmin: r.source === 'ADMIN',
    statusNote,
    admissionText: admissionTextOf(r),
    inviterText: inviterTextOf(r),
    inviterKind: r.inviter?.kind ?? null,
    appliedPriceText: appliedPriceTextOf(r),
    seatText: toSeatText(r.seats, seatSelection, MSG_SEAT.UNASSIGNED),
    canChangeSeats: seatSelection === true && r.status !== 'CANCELLED',
    hasMemo: Boolean(r.memo),
    isLocked: r.status === 'CONFIRMED' && r.admittedCount > 0,
    canEditItems: r.status !== 'CANCELLED',
  };
}

/** 정확 일치 예매를 맨 위로 — 일치가 없으면 matchId null, 순서 그대로 */
export function orderWithExactMatch<T extends { id: string; code: string }>(
  items: T[],
  search: string
): { items: T[]; matchId: string | null; code: string | null } {
  const code = toReservationCode(search);
  const match = code ? items.find((item) => item.code === code) : undefined;
  if (!code || !match) return { items, matchId: null, code };
  return {
    items: [match, ...items.filter((item) => item.id !== match.id)],
    matchId: match.id,
    code,
  };
}
