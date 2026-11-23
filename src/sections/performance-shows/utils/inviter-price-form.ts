// ----------------------------------------------------------------------
// 가격 카드 폼(U41 design §17 SCR-D11 — "기본가" · "SAM 관계자가") — 입력 문자열 ↔ 요청, 검증(순수 함수).
// 둘 다 필수 · 1~1,000,000원 정수(서버 InviterPricesRequest 와 같은 범위).
// ----------------------------------------------------------------------
import { MSG_D11 } from '@/src/shared/messages/d11';
import type {
  InviterPricesRequest,
  InviterPricesResponse,
} from '@/src/types/booking';

export const INVITER_PRICE_MIN = 1;
export const INVITER_PRICE_MAX = 1_000_000;

export interface InviterPriceFormInput {
  base: string;
  samRelated: string;
}

export type InviterPriceField = keyof InviterPriceFormInput;

export type InviterPriceFormErrors = Record<InviterPriceField, string | null>;

export const NO_INVITER_PRICE_ERRORS: InviterPriceFormErrors = {
  base: null,
  samRelated: null,
};

/** 서버 값 → 폼(없는 가격은 빈 칸) */
export function toInviterPriceForm(
  prices: InviterPricesResponse | null
): InviterPriceFormInput {
  return {
    base: prices?.base === null || !prices ? '' : String(prices.base),
    samRelated:
      prices?.samRelated === null || !prices ? '' : String(prices.samRelated),
  };
}

function validatePrice(value: string): string | null {
  const text = value.replace(/,/g, '').trim();
  if (text === '') return MSG_D11.PRICE_REQUIRED;
  const n = Number(text);
  if (!Number.isInteger(n) || n < INVITER_PRICE_MIN || n > INVITER_PRICE_MAX)
    return MSG_D11.PRICE_RANGE;
  return null;
}

export function validateInviterPriceForm(
  form: InviterPriceFormInput
): InviterPriceFormErrors {
  return {
    base: validatePrice(form.base),
    samRelated: validatePrice(form.samRelated),
  };
}

export function hasInviterPriceError(errors: InviterPriceFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function toInviterPricesRequest(
  form: InviterPriceFormInput
): InviterPricesRequest {
  return {
    base: Number(form.base.replace(/,/g, '').trim()),
    samRelated: Number(form.samRelated.replace(/,/g, '').trim()),
  };
}
