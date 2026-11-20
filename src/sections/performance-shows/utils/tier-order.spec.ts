import { describe, expect, it } from 'vitest';

import {
  moveTier,
  nextTierSortOrder,
} from '@/src/sections/performance-shows/utils/tier-order';

describe('tier-order', () => {
  it('새 등급 순서는 가장 큰 sortOrder + 1(없으면 0, 999 상한)', () => {
    expect(nextTierSortOrder([])).toBe(0);
    expect(
      nextTierSortOrder([{ sortOrder: 0 }, { sortOrder: 2 }, { sortOrder: 1 }])
    ).toBe(3);
    expect(nextTierSortOrder([{ sortOrder: 999 }])).toBe(999);
  });

  it('한 칸 옮기고 바뀐 등급의 sortOrder 만 돌려준다', () => {
    const tiers = [
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ];
    expect(moveTier(tiers, 'c', 'up')).toEqual([
      { id: 'c', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ]);
    expect(moveTier(tiers, 'a', 'down')).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
    ]);
  });

  it('맨 끝을 넘으면 바꾸지 않고, 틈·중복이 있던 순서는 0부터 다시 매긴다', () => {
    expect(moveTier([{ id: 'a', sortOrder: 0 }], 'a', 'up')).toEqual([]);
    expect(
      moveTier(
        [
          { id: 'a', sortOrder: 3 },
          { id: 'b', sortOrder: 3 },
          { id: 'c', sortOrder: 7 },
        ],
        'b',
        'up'
      )
    ).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ]);
  });
});
