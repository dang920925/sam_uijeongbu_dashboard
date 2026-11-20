import { describe, expect, it } from 'vitest';

import { toPopupRow } from '@/src/sections/popups/utils/popup-row';

const POPUP = {
  id: 'p1',
  imageUrl: 'https://x/p.png',
  linkUrl: null,
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  isActive: true,
  overlapsActive: true,
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('toPopupRow', () => {
  it('기간 안의 활성 팝업은 활성 success · 진행중 success, 링크 없으면 "-" 로 표시한다', () => {
    expect(toPopupRow(POPUP, '2026-11-19')).toEqual({
      id: 'p1',
      imageUrl: 'https://x/p.png',
      link: '-',
      period: '2026.11.01 ~ 2026.11.30',
      activeLabel: '활성',
      activeTone: 'success',
      statusLabel: '진행중',
      statusTone: 'success',
      overlapsActive: true,
    });
  });

  it('비활성·시작 전 팝업은 비활성 neutral · 예정 warning 으로 표시한다', () => {
    const row = toPopupRow(
      { ...POPUP, isActive: false, linkUrl: 'https://sam.example' },
      '2026-10-01'
    );
    expect(row).toMatchObject({
      link: 'https://sam.example',
      activeLabel: '비활성',
      activeTone: 'neutral',
      statusLabel: '예정',
      statusTone: 'warning',
    });
  });
});
