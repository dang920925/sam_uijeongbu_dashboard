import { describe, expect, it } from 'vitest';

import {
  formatPopupPeriod,
  getPopupPeriodStatus,
  overlapsActivePopups,
} from '@/src/sections/popups/utils/popup-period';

describe('getPopupPeriodStatus', () => {
  it('오늘이 시작일 전이면 예정, 기간 안(양끝 포함)이면 진행중, 종료일 뒤면 종료로 계산한다', () => {
    // Arrange
    const start = '2026-11-10';
    const end = '2026-11-20';
    // Act · Assert
    expect(getPopupPeriodStatus(start, end, '2026-11-09')).toBe('UPCOMING');
    expect(getPopupPeriodStatus(start, end, '2026-11-10')).toBe('ONGOING');
    expect(getPopupPeriodStatus(start, end, '2026-11-20')).toBe('ONGOING');
    expect(getPopupPeriodStatus(start, end, '2026-11-21')).toBe('ENDED');
  });
});

describe('formatPopupPeriod', () => {
  it('노출 기간을 "YYYY.MM.DD ~ YYYY.MM.DD" 로 표시한다', () => {
    expect(formatPopupPeriod('2026-11-01', '2026-12-31')).toBe(
      '2026.11.01 ~ 2026.12.31'
    );
  });
});

describe('overlapsActivePopups', () => {
  const others = [
    { id: 'a', startDate: '2026-11-01', endDate: '2026-11-10', isActive: true },
    {
      id: 'b',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      isActive: false,
    },
  ];

  it('활성 팝업과 하루라도 겹치면 true, 비활성 팝업과만 겹치면 false', () => {
    const base = { id: null, isActive: true };
    expect(
      overlapsActivePopups(
        { ...base, startDate: '2026-11-10', endDate: '2026-11-15' },
        others
      )
    ).toBe(true);
    expect(
      overlapsActivePopups(
        { ...base, startDate: '2026-12-01', endDate: '2026-12-05' },
        others
      )
    ).toBe(false);
  });

  it('자기 자신·비활성 후보·날짜가 비었거나 거꾸로면 겹침으로 보지 않는다', () => {
    expect(
      overlapsActivePopups(
        {
          id: 'a',
          startDate: '2026-11-01',
          endDate: '2026-11-10',
          isActive: true,
        },
        others
      )
    ).toBe(false);
    expect(
      overlapsActivePopups(
        {
          id: null,
          startDate: '2026-11-01',
          endDate: '2026-11-10',
          isActive: false,
        },
        others
      )
    ).toBe(false);
    expect(
      overlapsActivePopups(
        { id: null, startDate: '', endDate: '2026-11-10', isActive: true },
        others
      )
    ).toBe(false);
    expect(
      overlapsActivePopups(
        {
          id: null,
          startDate: '2026-11-09',
          endDate: '2026-11-02',
          isActive: true,
        },
        others
      )
    ).toBe(false);
  });
});
