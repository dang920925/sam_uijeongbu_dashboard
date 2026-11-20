import { describe, expect, it } from 'vitest';

import type { PriceTier } from '@/src/api/price-tier-mapper';
import {
  formatWon,
  toTierRowDisplay,
} from '@/src/sections/performance-shows/utils/tier-row';

const TIER: PriceTier = {
  id: 't1',
  name: 'fixture-일반',
  price: 15000,
  visibility: 'PUBLIC',
  linkToken: null,
  sortOrder: 0,
  isActive: true,
  usedQty: 0,
};

describe('tier-row', () => {
  it('금액을 천 단위 쉼표 + 원으로 보인다', () => {
    expect(formatWon(1)).toBe('1원');
    expect(formatWon(1000000)).toBe('1,000,000원');
  });

  it('누구나 등급은 neutral Label, 링크 없음, 안 쓰였으면 삭제 가능, 첫 줄은 위로 못 옮긴다', () => {
    // Act
    const row = toTierRowDisplay(TIER, 0, 2, 'https://fixture.example', 'p1');
    // Assert
    expect(row).toMatchObject({
      priceText: '15,000원',
      visibilityLabel: '누구나',
      visibilityTone: 'neutral',
      isLinkOnly: false,
      usedText: '0매',
      usedCardText: '예매 0매',
      canMoveUp: false,
      canMoveDown: true,
      canDelete: true,
      link: null,
    });
  });

  it('링크 전용 등급은 info Label·등급 링크, 쓰였으면 삭제 불가, 주소가 없으면 링크 null', () => {
    const linkOnly = {
      ...TIER,
      visibility: 'LINK_ONLY' as const,
      linkToken: 'tok',
      usedQty: 3,
    };
    const row = toTierRowDisplay(
      linkOnly,
      1,
      2,
      'https://fixture.example',
      'p1'
    );
    expect(row).toMatchObject({
      visibilityLabel: '링크 전용',
      visibilityTone: 'info',
      canMoveUp: true,
      canMoveDown: false,
      canDelete: false,
      link: 'https://fixture.example/works/p1/book?tier=tok',
    });
    expect(toTierRowDisplay(linkOnly, 1, 2, null, 'p1').link).toBeNull();
  });
});
