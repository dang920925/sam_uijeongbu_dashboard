import { describe, expect, it } from 'vitest';

import {
  EMPTY_SCHEDULE_FORM,
  fromScheduleItemResponse,
  toScheduleFormInput,
  toScheduleUpsertRequest,
} from '@/src/api/schedule-mapper';
import type { ScheduleItemResponse } from '@/src/types/content';

const RES: ScheduleItemResponse = {
  id: 's1',
  title: 'fixture-1-w3-일정',
  type: 'SHOW',
  startAt: '2026-12-01T10:00:00.000Z',
  endAt: null,
  location: null,
  description: null,
  classId: null,
  performanceId: 'p1',
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('schedule-mapper', () => {
  it('KST 입력 값에 +09:00 을 붙이고 빈 칸은 null 로 요청 바디를 만든다', () => {
    // Act
    const body = toScheduleUpsertRequest({
      ...EMPTY_SCHEDULE_FORM,
      title: ' fixture-1-w3-일정 ',
      startAt: '2026-12-01T19:00',
      location: '  ',
    });
    // Assert
    expect(body).toEqual({
      title: 'fixture-1-w3-일정',
      type: 'PRACTICE',
      startAt: '2026-12-01T19:00:00+09:00',
      endAt: null,
      location: null,
      description: null,
      performanceId: null,
      classId: null,
    });
  });

  it('응답의 UTC 시각을 수정 폼의 KST 입력 값으로 바꾼다', () => {
    // Act
    const form = toScheduleFormInput(fromScheduleItemResponse(RES));
    // Assert
    expect(form.startAt).toBe('2026-12-01T19:00');
    expect(form.endAt).toBe('');
    expect(form.performanceId).toBe('p1');
    expect(form.classId).toBe('');
  });

  it('생략된 선택 필드는 null 로 맞춘다', () => {
    // Arrange
    const res = {
      ...RES,
      endAt: undefined,
      performanceId: undefined,
    } as unknown as ScheduleItemResponse;
    // Act
    const schedule = fromScheduleItemResponse(res);
    // Assert
    expect(schedule.endAt).toBeNull();
    expect(schedule.performanceId).toBeNull();
  });
});
