import { describe, expect, it } from 'vitest';

import {
  toDashboardKpis,
  toPendingApplicationRows,
  toRecentPerformanceRows,
} from '@/src/sections/dashboard/utils/build-dashboard-view';
import type { DashboardSummary } from '@/src/types/dashboard';

const SUMMARY: DashboardSummary = {
  performances: { total: 25, ongoing: 3, upcoming: 4 },
  actorCount: 2,
  pendingApplicationCount: 6,
  uncontactedPendingCount: 4,
  pendingReservationCount: 0,
  scheduleCount: 7,
  recentPerformances: [
    { id: 'p1', title: 'fixture-1-w1-가', type: 'MUSICAL', status: 'ONGOING' },
    { id: 'p2', title: 'fixture-1-w1-나', type: 'PLAY', status: 'UPCOMING' },
    { id: 'p3', title: 'fixture-1-w1-다', type: 'SEMINAR', status: 'ENDED' },
  ],
  pendingApplications: [
    {
      id: 'a1',
      applicantName: 'fixture-1-w1-신청1',
      phone: '010-0000-0000',
      appType: 'CONSULTATION',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: 'a2',
      applicantName: 'fixture-1-w1-신청2',
      phone: '',
      appType: 'WORK_OBSERVATION',
      createdAt: '2026-11-18T00:00:00.000Z',
    },
  ],
};

describe('build-dashboard-view', () => {
  it('KPI 4개를 현행 순서·문구·색으로 만들고 전체 공연 설명에 진행·예정 수, 대기 신청서 설명에 연락 전 수를 넣는다', () => {
    // Act
    const kpis = toDashboardKpis(SUMMARY);
    // Assert
    expect(kpis.map((k) => [k.title, k.value, k.tone])).toEqual([
      ['전체 공연', '25', 'blue'],
      ['등록 배우', '2', 'emerald'],
      ['대기 신청서', '6', 'amber'],
      ['등록 일정', '7', 'purple'],
    ]);
    expect(kpis[0].description).toBe('진행중 3개 · 예정 4개');
    expect(kpis.slice(1).map((k) => k.description)).toEqual([
      '전체 배우 회원',
      '대기 중 · 연락 전 4건',
      '전체 일정 수',
    ]);
  });

  it('최근 공연 유형을 한국어 라벨로, 상태를 배지 문구·색으로 바꾼다', () => {
    // Act
    const rows = toRecentPerformanceRows(SUMMARY);
    // Assert
    expect(rows.map((r) => [r.secondary, r.labelText, r.labelTone])).toEqual([
      ['뮤지컬', '진행중', 'success'],
      ['연극', '예정', 'warning'],
      ['세미나', '종료', 'neutral'],
    ]);
  });

  it('대기 신청 연락처가 비면 - 로 보이고 배지는 대기(warning)다', () => {
    // Act
    const rows = toPendingApplicationRows(SUMMARY);
    // Assert
    expect(rows.map((r) => [r.primary, r.secondary])).toEqual([
      ['fixture-1-w1-신청1', '010-0000-0000'],
      ['fixture-1-w1-신청2', '-'],
    ]);
    expect(rows.every((r) => r.labelText === '대기')).toBe(true);
    expect(rows.every((r) => r.labelTone === 'warning')).toBe(true);
  });
});
