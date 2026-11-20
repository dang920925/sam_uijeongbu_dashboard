// ----------------------------------------------------------------------
// 예매 상세 표시 값(순수) — 드로어(공용)와 D12 표·카드가 같은 규칙을 쓴다.
// 무료 = 확정 + 0원(지휘자 결정 2026-11-20 — 0원 확정 건 보조 "무료"), 관리자 등록 = source ADMIN,
// 금액 덮어쓴 건 = amountOverridden("직접 입력"), 초대 = 단원 이름 / "{메모} (직접 입력)" / '-'.
// ----------------------------------------------------------------------
import {
  formatShowSlot,
  formatTierBreakdown,
  formatWon,
  type Reservation,
} from '@/src/api/reservation-mapper';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { CANCEL_REASON_LABEL } from '@/src/types/codes';
import { formatKstDateTime } from '@/src/utils/kst-date-format';
import { formatPhone } from '@/src/utils/phone-format';

const dash = MSG_COMMON.EMPTY_VALUE;

export function isFreeReservation(r: Pick<Reservation, 'status' | 'amount'>) {
  return r.status === 'CONFIRMED' && r.amount === 0;
}

export function inviterTextOf(
  r: Pick<Reservation, 'inviter' | 'inviterNote'>
): string {
  if (r.inviter) return r.inviter.name;
  if (r.inviterNote) return MSG_D12.INVITER_NOTE(r.inviterNote);
  return dash;
}

/** 입장 "{a}/{q}" — 취소 건은 '-' */
export function admissionTextOf(
  r: Pick<Reservation, 'status' | 'admittedCount' | 'quantity'>
): string {
  return r.status === 'CANCELLED' ? dash : `${r.admittedCount}/${r.quantity}`;
}

export interface ReservationDetailField {
  key: string;
  label: string;
  value: string;
  /** 둘째 줄(연락처·취소 사유 등) */
  sub?: string;
}

export function toReservationDetailFields(
  r: Reservation,
  performanceTitle: string | null
): ReservationDetailField[] {
  const title = r.performanceTitle ?? performanceTitle;
  const fields: ReservationDetailField[] = [];
  if (title)
    fields.push({
      key: 'perf',
      label: MSG_D12.DETAIL_PERFORMANCE,
      value: title,
    });
  fields.push(
    {
      key: 'show',
      label: MSG_D12.DETAIL_SHOW,
      value: formatShowSlot(r.showDate, r.startTime, true),
    },
    {
      key: 'booker',
      label: MSG_D12.DETAIL_BOOKER,
      value: r.bookerName,
      sub: formatPhone(r.bookerPhone) ?? MSG_D12.NO_PHONE,
    },
    {
      key: 'tiers',
      label: MSG_D12.DETAIL_TIERS,
      // 할인(링크 전용) 등급 줄은 이름 뒤에 "(링크 전용(할인))" — 지휘자 표시 표(2026-11-20)
      value:
        formatTierBreakdown(
          r.items.map((line) => ({
            tierName:
              line.visibility === 'LINK_ONLY'
                ? `${line.tierName}(${MSG_D12.LINK_ONLY})`
                : line.tierName,
            quantity: line.quantity,
          }))
        ) || dash,
      sub: MSG_D12.TOTAL_QTY(r.quantity),
    },
    {
      key: 'amount',
      label: MSG_D12.DETAIL_AMOUNT,
      value: formatWon(r.amount),
      sub: r.amountOverridden ? MSG_D12.OVERRIDDEN : undefined,
    },
    {
      key: 'depositor',
      label: MSG_D12.DETAIL_DEPOSITOR,
      value: r.depositorName ?? dash,
    },
    {
      key: 'due',
      label: MSG_D12.DETAIL_DUE,
      value: formatKstDateTime(r.depositDueAt),
    },
    {
      key: 'admission',
      label: MSG_D12.DETAIL_ADMISSION,
      value: admissionTextOf(r),
    },
    { key: 'inviter', label: MSG_D12.DETAIL_INVITER, value: inviterTextOf(r) },
    { key: 'memo', label: MSG_D12.DETAIL_MEMO, value: r.memo ?? dash },
    {
      key: 'created',
      label: MSG_D12.DETAIL_CREATED_AT,
      value: formatKstDateTime(r.createdAt),
    }
  );
  if (r.confirmedAt)
    fields.push({
      key: 'confirmed',
      label: MSG_D12.DETAIL_CONFIRMED_AT,
      value: formatKstDateTime(r.confirmedAt),
    });
  if (r.cancelledAt)
    fields.push({
      key: 'cancelled',
      label: MSG_D12.DETAIL_CANCELLED_AT,
      value: formatKstDateTime(r.cancelledAt),
      sub: r.cancelReason ? CANCEL_REASON_LABEL[r.cancelReason] : undefined,
    });
  return fields;
}
