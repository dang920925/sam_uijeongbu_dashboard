// 단위 테스트 전용 — 일정 픽스처(fixture-u23- 접두사).
import type { Schedule } from '@/src/types/content';

export function makeSchedule(overrides: Partial<Schedule>): Schedule {
  return {
    id: 's1',
    title: 'fixture-u23-일정',
    type: 'PRACTICE',
    startAt: '2026-12-03T11:00:00.000Z',
    endAt: null,
    location: null,
    description: null,
    classId: null,
    performanceId: null,
    status: 'ACTIVE',
    cancelReason: null,
    observationClosed: null,
    ...overrides,
  };
}
