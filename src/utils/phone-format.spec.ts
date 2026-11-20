import { describe, expect, it } from 'vitest';

import { formatPhone } from '@/src/utils/phone-format';

describe('formatPhone', () => {
  it('숫자만 온 휴대전화 번호에 하이픈을 넣는다', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678');
    expect(formatPhone('0111234567')).toBe('011-123-4567');
    expect(formatPhone('010-1234-5678')).toBe('010-1234-5678');
  });

  it('없으면 null, 모르는 형식은 그대로 둔다', () => {
    expect(formatPhone(null)).toBeNull();
    expect(formatPhone('')).toBeNull();
    expect(formatPhone('12345')).toBe('12345');
  });
});
