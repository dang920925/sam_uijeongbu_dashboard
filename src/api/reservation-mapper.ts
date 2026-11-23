// ----------------------------------------------------------------------
// 예매 매퍼(FN-33·34 + develop §11.10 가격 등급) — 계약 AdminReservationItem ↔ 화면 모델.
// (리드가 수동 등록·등급 줄 부분을 먼저 만들고, D12 작업자가 이어서 채운다 — 입장 체크 D13 도 수동 등록을 쓴다.)
// ----------------------------------------------------------------------
import type {
  AdminReservationItemResponse,
  ManualReservationRequest,
  ReservationCustomLineRequest,
  ReservationItemsRequest,
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
    appliedPrice: res.appliedPrice ?? null,
    inviterNote: res.inviterNote ?? null,
    inviterCategory: res.inviterCategory ?? null,
    seats: res.seats ?? [],
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
  /** 단원 id · INVITER_STAFF_VALUE(연출·스태프) · INVITER_SAM_VALUE(SAM 관계자) · null(선택 안 함) — U41 */
  inviterMemberId: string | null;
  /** U35 — 고른 좌석(선택, 비우면 좌석 미정) */
  seatIds?: string[];
  memo: string;
  status: 'PENDING' | 'CONFIRMED';
  /** CONFIRMED 일 때만 보낸다(0~매수) */
  admitNow: string;
}

/** 수동 등록 초대 선택지 "연출·스태프 관계자"(U41) — 요청 inviter { kind: STAFF_RELATED } */
export const INVITER_STAFF_VALUE = '__STAFF_RELATED__';
/** 수동 등록 초대 선택지 "SAM 관계자"(U41) — 요청 inviter { kind: SAM_RELATED } */
export const INVITER_SAM_VALUE = '__SAM_RELATED__';

/** 수동 등록 선택값 → 요청 inviter(빈 값 = 보내지 않음 — 관리자 등록은 선택, 자체 결정) */
export function toManualInviter(
  value: string | null
): ManualReservationRequest['inviter'] {
  if (!value) return null;
  if (value === INVITER_STAFF_VALUE) return { kind: 'STAFF_RELATED' };
  if (value === INVITER_SAM_VALUE) return { kind: 'SAM_RELATED' };
  return { kind: 'MEMBER', memberId: value };
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

/**
 * 요청 본문용 줄 — 등급 줄이 하나도 없으면 items 키를 뺀다.
 * 서버 ReservationLinesRequestDto 는 items 가 오면 1~10줄(@ArrayMinSize(1))이라 빈 배열은 400 RSV_012 —
 * 직접 입력 줄만 있는 수동 등록·등급 수정이 막혔다(integration 실측 2026-11-20).
 */
function toRequestLines(input: ReservationLinesFormInput): {
  items?: ReservationTierLineRequest[];
  customLine: ReservationCustomLineRequest | null;
  amountOverride: number | null;
} {
  const { items, ...rest } = toReservationLines(input);
  return items.length > 0 ? { items, ...rest } : rest;
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
    ...toRequestLines(input),
    status: input.status,
    memo: memo === '' ? null : memo,
    inviter: toManualInviter(input.inviterMemberId),
    ...(input.seatIds && input.seatIds.length > 0
      ? { seatIds: [...input.seatIds] }
      : {}),
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

// ─── D12 작업자(W2) 추가 ─────────────────────────────────────────────

/** 금액 표시 "12,000원"(0 이면 "0원") */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 회차 표시 — 'YYYY-MM-DD' + 'HH:mm' → "12.12 14:00"(표 — designer 보강2 "요일 빼고"),
 * withWeekday 면 "12.12 (토) 14:00"(Dialog·집계·드로어). 날짜 형식이 아니면 원문 그대로.
 */
export function formatShowSlot(
  showDate: string,
  startTime: string,
  withWeekday = false
): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(showDate);
  if (!m) return `${showDate} ${startTime}`.trim();
  const day = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  ).getUTCDay();
  const date = `${m[2]}.${m[3]}`;
  return withWeekday
    ? `${date} (${WEEKDAY[day]}) ${startTime}`
    : `${date} ${startTime}`;
}

/** 등급 수정 요청(`PUT /admin/reservations/{id}/items`) — 줄 통째 교체 + version */
export function toReservationItemsRequest(
  input: ReservationLinesFormInput,
  version: number
): ReservationItemsRequest {
  return { ...toRequestLines(input), version };
}

/** 기존 예매 → 등급 수정 폼 초기값(등급 줄 수량 · 직접 입력 줄 · 덮어쓴 금액) */
export function toReservationLinesFormInput(
  reservation: Pick<Reservation, 'items' | 'amount' | 'amountOverridden'>
): ReservationLinesFormInput {
  const custom = reservation.items.find((line) => line.isCustom) ?? null;
  const tierQuantities: Record<string, string> = {};
  for (const line of reservation.items)
    if (!line.isCustom && line.tierId)
      tierQuantities[line.tierId] = String(line.quantity);
  return {
    tierQuantities,
    useCustom: custom !== null,
    customLabel: custom?.tierName ?? '',
    customQuantity: custom ? String(custom.quantity) : '',
    customAmount: custom ? String(custom.lineAmount) : '',
    useAmountOverride: reservation.amountOverridden,
    amountOverride: reservation.amountOverridden
      ? String(reservation.amount)
      : '',
  };
}

/**
 * 폼 미리 계산 총액 — 등급 줄(단가 = priceOf(tierId)) + 직접 입력 금액. 금액 덮어쓰기가 켜져 있으면 그 값.
 * 화면 미리보기용(서버가 정본 — 같은 등급은 스냅숏 가격, J-77).
 */
export function previewLinesAmount(
  input: ReservationLinesFormInput,
  priceOf: (tierId: string) => number
): { quantity: number; lineAmount: number; amount: number } {
  const { items, customLine, amountOverride } = toReservationLines(input);
  const lineAmount =
    items.reduce((sum, line) => sum + priceOf(line.tierId) * line.quantity, 0) +
    (customLine?.amount ?? 0);
  return {
    quantity: totalQuantityOf(input),
    lineAmount,
    amount: amountOverride ?? lineAmount,
  };
}
