import { describe, expect, it } from 'vitest';

import { toScheduleRow } from '@/src/sections/schedules/utils/schedule-row';
import type { Schedule } from '@/src/types/content';

const SCHEDULE: Schedule = {
  id: 's1',
  title: 'fixture-1-w3-일정',
  type: 'ETC',
  startAt: '2026-11-30T15:30:00.000Z',
  endAt: null,
  location: ' ',
  description: null,
  classId: null,
  performanceId: null,
};

describe('schedule-row', () => {
  it('UTC 시작 시각을 KST 날짜·시각으로 표시한다', () => {
    // Act
    const row = toScheduleRow(SCHEDULE);
    // Assert
    expect(row.startAt).toBe('2026.12.01 00:30');
    expect(row.endAt).toBeNull();
    expect(row.location).toBeNull();
  });

  it('기타 타입은 outline, 공연 타입은 info 배지다', () => {
    expect(toScheduleRow(SCHEDULE)).toMatchObject({
      typeLabel: '기타',
      typeVariant: 'outline',
    });
    expect(toScheduleRow({ ...SCHEDULE, type: 'SHOW' })).toMatchObject({
      typeLabel: '공연',
      typeTone: 'info',
      typeVariant: 'soft',
    });
  });
});
