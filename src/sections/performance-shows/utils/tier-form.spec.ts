import { describe, expect, it } from 'vitest';

import { EMPTY_PRICE_TIER_FORM } from '@/src/api/price-tier-mapper';
import {
  hasPriceTierFormError,
  validatePriceTierForm,
} from '@/src/sections/performance-shows/utils/tier-form';

describe('tier-form', () => {
  it('이름·가격이 비면 각각 필수 문구를 돌려준다', () => {
    const errors = validatePriceTierForm(EMPTY_PRICE_TIER_FORM);
    expect(errors).toEqual({
      name: '이름을 입력해주세요',
      price: '가격을 입력해주세요',
    });
    expect(hasPriceTierFormError(errors)).toBe(true);
  });

  it('가격은 1~1,000,000원 정수만 — 0원 등급은 없다', () => {
    const check = (price: string) =>
      validatePriceTierForm({ ...EMPTY_PRICE_TIER_FORM, name: '일반', price })
        .price;
    expect(check('0')).toBe('입력값을 확인해주세요.');
    expect(check('1')).toBeNull();
    expect(check('1000000')).toBeNull();
    expect(check('1000001')).toBe('입력값을 확인해주세요.');
    expect(check('1.5')).toBe('입력값을 확인해주세요.');
  });
});
