import { describe, expect, it } from 'vitest';

import { toPerformanceListRows } from '@/src/sections/performance-list/utils/to-performance-list-rows';
import type { PerformanceSummary } from '@/src/types/performance';

const BASE: PerformanceSummary = {
  id: 'p1',
  title: 'fixture-1-w1-공연',
  type: 'MUSICAL',
  status: 'ONGOING',
  isVisible: true,
  seatSelectionEnabled: false,
  posterImageUrl: null,
  createdAt: '2026-11-18T15:30:00.000Z',
};

describe('toPerformanceListRows', () => {
  it('등록일을 실제 KST 날짜(YYYY.MM.DD)로 보인다', () => {
    // Act — UTC 18일 15:30 = KST 19일 00:30
    const [row] = toPerformanceListRows([BASE]);
    // Assert
    expect(row.createdLabel).toBe('2026.11.19');
  });

  it('타입·상태를 현행 라벨과 배지 색으로 바꾼다', () => {
    // Arrange
    const items: PerformanceSummary[] = [
      BASE,
      { ...BASE, id: 'p2', type: 'PLAY', status: 'UPCOMING' },
      { ...BASE, id: 'p3', type: 'ETC', status: 'ENDED' },
    ];
    // Act
    const rows = toPerformanceListRows(items);
    // Assert
    expect(rows.map((r) => [r.typeLabel, r.statusLabel, r.statusTone])).toEqual(
      [
        ['뮤지컬', '진행중', 'success'],
        ['연극', '예정', 'warning'],
        ['기타', '종료', 'neutral'],
      ]
    );
  });

  it('노출 여부를 노출/비노출 문구로 바꾸고 포스터 URL 은 그대로 둔다', () => {
    // Arrange
    const hidden = {
      ...BASE,
      isVisible: false,
      posterImageUrl: 'https://example.test/poster.png',
    };
    // Act
    const [visibleRow, hiddenRow] = toPerformanceListRows([BASE, hidden]);
    // Assert
    expect(visibleRow.visibilityLabel).toBe('노출');
    expect(hiddenRow.visibilityLabel).toBe('비노출');
    expect(hiddenRow.posterImageUrl).toBe('https://example.test/poster.png');
  });
});
