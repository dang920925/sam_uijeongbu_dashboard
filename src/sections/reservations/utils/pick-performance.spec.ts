import { describe, expect, it } from 'vitest';

import { pickPerformanceId } from '@/src/sections/reservations/utils/pick-performance';

describe('pickPerformanceId', () => {
  const ids = ['p-1', 'p-2', 'p-3'];

  it('목록에 있는 첫 후보를 고른다', () => {
    expect(pickPerformanceId([null, 'p-x', 'p-2'], ids)).toBe('p-2');
  });

  it('후보가 없으면 첫 공연, 공연이 없으면 null 을 준다', () => {
    expect(pickPerformanceId([undefined, null], ids)).toBe('p-1');
    expect(pickPerformanceId(['p-1'], [])).toBeNull();
  });
});
