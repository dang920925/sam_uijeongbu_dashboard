// ----------------------------------------------------------------------
// 가격 등급 다이얼로그 검증(develop §11.10 price_tiers) — 이름 1~30자 필수, 가격 1~1,000,000원 필수
// (0원 등급 없음 — 사용자 결정, 무료는 예매 관리의 '예매 등록'). 가격 범위·형식 오류는 COMMON_001 문구.
// ----------------------------------------------------------------------
import type { PriceTierFormInput } from '@/src/api/price-tier-mapper';
import { validateIntRange } from '@/src/sections/performance-shows/utils/form-number';
import { MSG_D11 } from '@/src/shared/messages/d11';

export const TIER_NAME_MAX = 30;
export const TIER_PRICE_MIN = 1;
export const TIER_PRICE_MAX = 1_000_000;

export interface PriceTierFormErrors {
  name: string | null;
  price: string | null;
}

export const NO_TIER_FORM_ERRORS: PriceTierFormErrors = {
  name: null,
  price: null,
};

export function validatePriceTierForm(
  input: PriceTierFormInput
): PriceTierFormErrors {
  const price = input.price.trim();
  return {
    name: input.name.trim() === '' ? MSG_D11.TIER_NAME_REQUIRED : null,
    price:
      price === ''
        ? MSG_D11.TIER_PRICE_REQUIRED
        : validateIntRange(price, TIER_PRICE_MIN, TIER_PRICE_MAX),
  };
}

export function hasPriceTierFormError(errors: PriceTierFormErrors): boolean {
  return errors.name !== null || errors.price !== null;
}
