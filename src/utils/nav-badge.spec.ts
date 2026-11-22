import { describe, expect, it } from 'vitest';

import { toNavBadge } from '@/src/utils/nav-badge';

describe('toNavBadge(U40)', () => {
  it('0·음수·없음·숫자 아님이면 숨긴다(null)', () => {
    expect(toNavBadge('reservations', 0)).toBeNull();
    expect(toNavBadge('reservations', -1)).toBeNull();
    expect(toNavBadge('reservations', undefined)).toBeNull();
    expect(toNavBadge('reservations', Number.NaN)).toBeNull();
  });

  it('1~99 는 숫자 그대로, 이름은 "입금 대기 n건"·"연락 전 n건"이다', () => {
    expect(toNavBadge('reservations', 3)).toEqual({
      text: '3',
      label: '입금 대기 3건',
    });
    expect(toNavBadge('applications', 99)).toEqual({
      text: '99',
      label: '연락 전 99건',
    });
  });

  it('99 를 넘으면 "99+" 로 보이고 이름에는 실제 숫자를 쓴다', () => {
    expect(toNavBadge('reservations', 100)).toEqual({
      text: '99+',
      label: '입금 대기 100건',
    });
  });
});
