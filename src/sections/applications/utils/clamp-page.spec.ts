import { describe, expect, it } from 'vitest';

import { clampPage } from '@/src/sections/applications/utils/clamp-page';

describe('clampPage', () => {
  it('쪽 수 안의 페이지는 그대로 둔다', () => {
    // Arrange · Act · Assert
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(3, 3)).toBe(3);
  });

  it('마지막 쪽이 사라지면 새 마지막 쪽으로 옮긴다', () => {
    // Arrange · Act
    const result = clampPage(3, 2);
    // Assert
    expect(result).toBe(2);
  });

  it('서버가 0건으로 totalPages 0 을 주면 1쪽에 머문다(page 0 을 만들지 않는다)', () => {
    // Arrange · Act
    const result = clampPage(1, 0);
    // Assert
    expect(result).toBe(1);
    expect(clampPage(4, 0)).toBe(1);
  });
});
