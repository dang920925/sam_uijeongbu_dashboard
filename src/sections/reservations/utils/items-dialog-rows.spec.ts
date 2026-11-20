import { describe, expect, it } from 'vitest';

import { toItemsDialogRows } from '@/src/sections/reservations/utils/items-dialog-rows';

describe('toItemsDialogRows', () => {
  it('예매에 있던 등급은 예매 당시 가격, 나머지 사용 중 등급은 지금 가격으로 보인다', () => {
    // Arrange
    const reservation = {
      items: [
        {
          tierId: 't-1',
          tierName: '일반',
          unitPrice: 10000,
          quantity: 2,
          lineAmount: 20000,
          isCustom: false,
          visibility: 'PUBLIC' as const,
        },
        {
          tierId: null,
          tierName: '초대',
          unitPrice: 0,
          quantity: 1,
          lineAmount: 0,
          isCustom: true,
          visibility: null,
        },
      ],
    };
    const tiers = [
      { id: 't-1', name: '일반', price: 12000, visibility: 'PUBLIC' as const },
      {
        id: 't-2',
        name: '스태프',
        price: 5000,
        visibility: 'LINK_ONLY' as const,
      },
    ];
    // Act
    const { rows, prices } = toItemsDialogRows(reservation, tiers);
    // Assert
    expect(rows.map((r) => r.priceText)).toEqual([
      '예매 당시 10,000원',
      '지금 가격 5,000원',
    ]);
    expect(rows[1].isLinkOnly).toBe(true);
    expect(prices).toEqual({ 't-1': 10000, 't-2': 5000 });
  });
});
