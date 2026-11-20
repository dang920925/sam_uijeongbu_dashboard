// ----------------------------------------------------------------------
// 수동 등록·등급 수정 폼 검증(순수 함수) — develop §11.10 ManualReservationRequest 규칙:
// 이름 1~50 · 연락처 선택(형식) · 줄 합계 1~20매(items·customLine 중 하나 이상 — RSV_012 미리 막음) ·
// 직접 입력 이름 ≤30 · 매수 1~20 · 금액 0 이상 · 금액 덮어쓰기 0 이상 · 남은 좌석 이하(RSV_003 미리 막음) ·
// 입장 인원 0~매수(CONFIRMED 일 때만).
// ----------------------------------------------------------------------
import {
  toInt,
  totalQuantityOf,
  type ManualReservationFormInput,
  type ReservationLinesFormInput,
} from '@/src/api/reservation-mapper';
import { MSG_D12 } from '@/src/shared/messages/d12';

export const MAX_RESERVATION_QTY = 20;
const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;
const isDigits = (value: string) => /^[0-9]+$/.test(value.trim());

export interface ReservationLinesErrors {
  lines: string | null;
  customLabel: string | null;
  customQuantity: string | null;
  customAmount: string | null;
  amountOverride: string | null;
}

export interface ManualReservationErrors extends ReservationLinesErrors {
  showId: string | null;
  bookerName: string | null;
  bookerPhone: string | null;
  admitNow: string | null;
}

export function validateReservationLines(
  input: ReservationLinesFormInput
): ReservationLinesErrors {
  const total = totalQuantityOf(input);
  const customQty = toInt(input.customQuantity);
  return {
    lines: total < 1 || total > MAX_RESERVATION_QTY ? MSG_D12.ERR_QTY : null,
    customLabel:
      input.useCustom && input.customLabel.trim().length > 30
        ? MSG_D12.ERR_LABEL_LONG
        : null,
    customQuantity:
      input.useCustom &&
      (!isDigits(input.customQuantity) ||
        customQty < 1 ||
        customQty > MAX_RESERVATION_QTY)
        ? MSG_D12.ERR_QTY
        : null,
    customAmount:
      input.useCustom && !isDigits(input.customAmount)
        ? MSG_D12.ERR_AMOUNT
        : null,
    amountOverride:
      input.useAmountOverride && !isDigits(input.amountOverride)
        ? MSG_D12.ERR_AMOUNT
        : null,
  };
}

export function validateManualReservation(
  input: ManualReservationFormInput
): ManualReservationErrors {
  const name = input.bookerName.trim();
  const phone = input.bookerPhone.trim();
  const total = totalQuantityOf(input);
  const admit = toInt(input.admitNow);
  return {
    ...validateReservationLines(input),
    showId: input.showId ? null : MSG_D12.ERR_SHOW,
    bookerName:
      name === ''
        ? MSG_D12.ERR_NAME
        : name.length > 50
          ? MSG_D12.ERR_NAME_LONG
          : null,
    bookerPhone:
      phone !== '' && !PHONE_PATTERN.test(phone) ? MSG_D12.ERR_PHONE : null,
    admitNow:
      input.status === 'CONFIRMED' &&
      (!isDigits(input.admitNow) || admit < 0 || admit > total)
        ? MSG_D12.ERR_ADMIT(total)
        : null,
  };
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((value) => value !== null);
}

/** 남은 좌석 초과 문구 — 좌석 수 미정(null)이면 제한 없음 */
export function seatsBlockMessage(
  total: number,
  remainingSeats: number | null
): string | null {
  return remainingSeats !== null && total > remainingSeats
    ? MSG_D12.ERR_SEATS(remainingSeats)
    : null;
}

export type ManualEntryMode = 'tier' | 'custom';

/**
 * 화면 상태 → 보낼 폼 값. 입력 방식이 '직접 입력'이면 등급 수량을 비우고, '등급별 수량'이면 직접 입력 줄을 끈다.
 * 입장 인원을 손대지 않았으면 기본 = 매수(designer §13.11 남은 확인 6).
 */
export function toEffectiveManualInput(
  form: ManualReservationFormInput,
  mode: ManualEntryMode,
  isAdmitTouched: boolean
): ManualReservationFormInput {
  const lines =
    mode === 'custom'
      ? { ...form, tierQuantities: {}, useCustom: true }
      : { ...form, useCustom: false };
  return {
    ...lines,
    admitNow: isAdmitTouched ? form.admitNow : String(totalQuantityOf(lines)),
  };
}
