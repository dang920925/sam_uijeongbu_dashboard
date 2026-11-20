// ----------------------------------------------------------------------
// 예매 매퍼(FN-33·34 + develop §11.10 가격 등급) — 계약 AdminReservationItem ↔ 화면 모델.
// (리드가 수동 등록·등급 줄 부분을 먼저 만들고, D12 작업자가 이어서 채운다 — 입장 체크 D13 도 수동 등록을 쓴다.)
// ----------------------------------------------------------------------
import type {
  AdminReservationItemResponse,
  ManualReservationRequest,
  ReservationCustomLineRequest,
  ReservationTierLineRequest,
} from '@/src/types/booking';

/** 화면 모델 — 계약 모양에 공연 id·제목을 null 로 정규화(빠른 검색 응답에만 올 수 있음) */
export type Reservation = Omit<
  AdminReservationItemResponse,
  'performanceId' | 'performanceTitle'
> & { performanceId: string | null; performanceTitle: string | null };

export function fromAdminReservationItemResponse(
  res: AdminReservationItemResponse
): Reservation {
  return {
    ...res,
    performanceId: res.performanceId ?? null,
    performanceTitle: res.performanceTitle ?? null,
    items: res.items ?? [],
    bookerPhone: res.bookerPhone || null,
    depositorName: res.depositorName || null,
    depositDueAt: res.depositDueAt ?? null,
    inviter: res.inviter ?? null,
    inviterNote: res.inviterNote ?? null,
    confirmedAt: res.confirmedAt ?? null,
    confirmedBy: res.confirmedBy ?? null,
    cancelledAt: res.cancelledAt ?? null,
    cancelReason: res.cancelReason ?? null,
    memo: res.memo ?? null,
  };
}

/**
 * 등급 줄 폼 값 — 등급 id → 수량 문자열(빈 칸·0 은 보내지 않음).
 * 직접 입력은 useCustom 이 켜졌을 때만, 금액 덮어쓰기는 useAmountOverride 일 때만 보낸다.
 */
export interface ReservationLinesFormInput {
  tierQuantities: Record<string, string>;
  useCustom: boolean;
  customLabel: string;
  customQuantity: string;
  customAmount: string;
  useAmountOverride: boolean;
  amountOverride: string;
}

/** 수동 등록 폼 값 — 숫자 칸은 입력 문자열 그대로 들고 있다가 요청 때 정수로 바꾼다 */
export interface ManualReservationFormInput extends ReservationLinesFormInput {
  showId: string;
  bookerName: string;
  /** 선택 — 빈 칸이면 null */
  bookerPhone: string;
  inviterMemberId: string | null;
  memo: string;
  status: 'PENDING' | 'CONFIRMED';
  /** CONFIRMED 일 때만 보낸다(0~매수) */
  admitNow: string;
}

export function toInt(value: string): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : 0;
}

/** 폼 → 등급 줄·직접 입력·금액 덮어쓰기(수동 등록·등급 수정 공용) */
export function toReservationLines(input: ReservationLinesFormInput): {
  items: ReservationTierLineRequest[];
  customLine: ReservationCustomLineRequest | null;
  amountOverride: number | null;
} {
  const items = Object.entries(input.tierQuantities)
    .map(([tierId, quantity]) => ({ tierId, quantity: toInt(quantity) }))
    .filter((line) => line.quantity > 0);
  const label = input.customLabel.trim();
  return {
    items,
    customLine: input.useCustom
      ? {
          ...(label ? { label } : {}),
          quantity: toInt(input.customQuantity),
          amount: toInt(input.customAmount),
        }
      : null,
    amountOverride: input.useAmountOverride
      ? toInt(input.amountOverride)
      : null,
  };
}

/** 줄 합계 매수(직접 입력 포함) */
export function totalQuantityOf(input: ReservationLinesFormInput): number {
  const { items, customLine } = toReservationLines(input);
  return (
    items.reduce((sum, line) => sum + line.quantity, 0) +
    (customLine?.quantity ?? 0)
  );
}

export function toManualReservationRequest(
  input: ManualReservationFormInput
): ManualReservationRequest {
  const memo = input.memo.trim();
  const phone = input.bookerPhone.trim();
  return {
    showId: input.showId,
    bookerName: input.bookerName.trim(),
    bookerPhone: phone === '' ? null : phone,
    ...toReservationLines(input),
    status: input.status,
    memo: memo === '' ? null : memo,
    inviterMemberId: input.inviterMemberId || null,
    ...(input.status === 'CONFIRMED'
      ? { admitNow: toInt(input.admitNow) }
      : {}),
  };
}

/** 예매번호 형식(4자리 숫자 — 계약 code CHAR(4)) — 앞뒤 공백·'#' 은 무시 */
export function toReservationCode(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, '');
  return /^[0-9]{4}$/.test(trimmed) ? trimmed : null;
}

/** 등급별 매수 한 줄 — "일반 2 · 스태프 1"(design §6.1b) */
export function formatTierBreakdown(
  lines: { tierName: string; quantity: number }[]
): string {
  return lines.map((line) => `${line.tierName} ${line.quantity}`).join(' · ');
}
