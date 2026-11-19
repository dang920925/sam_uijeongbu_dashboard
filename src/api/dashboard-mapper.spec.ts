import { describe, expect, it } from 'vitest';

import { fromDashboardSummaryResponse } from '@/src/api/dashboard-mapper';
import type { DashboardSummaryResponse } from '@/src/types/dashboard';

const RESPONSE: DashboardSummaryResponse = {
  performances: { total: 25, ongoing: 3, upcoming: 4 },
  actorCount: 2,
  pendingApplicationCount: 6,
  scheduleCount: 7,
  recentPerformances: [
    {
      id: 'p1',
      title: 'fixture-1-w1-공연',
      type: 'MUSICAL',
      status: 'ONGOING',
    },
  ],
  pendingApplications: [
    {
      id: 'a1',
      applicantName: 'fixture-1-w1-신청자',
      phone: '010-0000-0000',
      appType: 'CONSULTATION',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
  ],
};

describe('dashboard-mapper', () => {
  it('요약 응답의 집계 수치를 상한 없이 그대로 화면 모델에 둔다', () => {
    // Act
    const summary = fromDashboardSummaryResponse(RESPONSE);
    // Assert
    expect(summary.performances).toEqual({
      total: 25,
      ongoing: 3,
      upcoming: 4,
    });
    expect(summary.actorCount).toBe(2);
    expect(summary.pendingApplicationCount).toBe(6);
    expect(summary.scheduleCount).toBe(7);
  });

  it('최근 공연·대기 신청 목록을 계약 필드만 남겨 매핑한다', () => {
    // Arrange
    const withExtra = {
      ...RESPONSE,
      recentPerformances: [
        { ...RESPONSE.recentPerformances[0], extra: 'drop' },
      ],
    } as unknown as DashboardSummaryResponse;
    // Act
    const summary = fromDashboardSummaryResponse(withExtra);
    // Assert
    expect(summary.recentPerformances).toEqual([
      {
        id: 'p1',
        title: 'fixture-1-w1-공연',
        type: 'MUSICAL',
        status: 'ONGOING',
      },
    ]);
    expect(summary.pendingApplications[0]).toEqual(
      RESPONSE.pendingApplications[0]
    );
  });

  it('목록이 빠진 응답은 빈 배열로 매핑한다', () => {
    // Arrange
    const missing = {
      ...RESPONSE,
      recentPerformances: undefined,
      pendingApplications: undefined,
    } as unknown as DashboardSummaryResponse;
    // Act
    const summary = fromDashboardSummaryResponse(missing);
    // Assert
    expect(summary.recentPerformances).toEqual([]);
    expect(summary.pendingApplications).toEqual([]);
  });
});
