import { describe, expect, it } from 'vitest';

import {
  toPerformanceOptions,
  toRoleOptions,
  toSamCastRows,
  toSamCreditRows,
} from '@/src/sections/members/utils/sam-credits-display';

const DATA = {
  casts: [
    {
      roleId: 'r1',
      roleName: null,
      performanceId: 'p1',
      performanceTitle: 'fixture-작품',
      performanceVisible: false,
      year: 2026,
      note: 'A캐스트',
      showOverrideCount: 0,
    },
  ],
  credits: [
    {
      creditId: 'c1',
      title: '조연출',
      performanceId: 'p1',
      performanceTitle: 'fixture-작품',
      isVisible: false,
    },
  ],
};

describe('sam-credits-display', () => {
  it('출연 묶음은 "출연", 비노출 작품 표시를 단다', () => {
    expect(toSamCastRows(DATA)).toEqual([
      {
        key: 'p1-r1',
        roleId: 'r1',
        title: 'fixture-작품',
        isHidden: true,
        roleLabel: '출연',
        note: 'A캐스트',
        year: 2026,
      },
    ]);
    expect(toSamCreditRows(DATA)).toEqual([
      {
        id: 'c1',
        title: '조연출',
        performanceTitle: 'fixture-작품',
        isVisible: false,
      },
    ]);
  });

  it('작품 선택지는 비노출·종료 상태를 라벨에 붙인다', () => {
    const base = {
      type: 'PLAY' as const,
      posterImageUrl: null,
      createdAt: '2026-11-20T00:00:00.000Z',
      // T-SEAT(U35) 필드 — v1.3.0 합치기
      seatSelectionEnabled: false,
    };
    expect(
      toPerformanceOptions([
        { ...base, id: 'a', title: '가', status: 'ONGOING', isVisible: true },
        { ...base, id: 'b', title: '나', status: 'ENDED', isVisible: false },
      ])
    ).toEqual([
      { value: 'a', label: '가' },
      { value: 'b', label: '나 (비노출 · 종료)' },
    ]);
  });

  it('배역 선택지는 이름 있는 배역만이다', () => {
    const role = {
      description: null,
      sortOrder: 0,
      isRecruiting: false,
      publicNow: false,
      defaultCast: [],
    };
    expect(
      toRoleOptions([
        { ...role, id: 'r1', name: '햄릿' },
        { ...role, id: 'r2', name: null },
      ])
    ).toEqual([{ value: 'r1', label: '햄릿' }]);
  });
});
