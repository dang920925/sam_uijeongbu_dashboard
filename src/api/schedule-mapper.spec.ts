import { describe, expect, it } from 'vitest';

import {
  EMPTY_SCHEDULE_FORM,
  fromScheduleItemResponse,
  toScheduleCancelRequest,
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
  status: 'ACTIVE',
  cancelReason: null,
  observationClosed: null,
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

  it('반만 연결된 응답(서버가 반의 공연 id 를 채움)이면 수정 폼에 공연·반을 함께 채운다', () => {
    // Arrange — 서버 ScheduleItemResponseDto: performanceId = 일정 ?? 연결 반의 공연(createdAt 없음)
    const res: ScheduleItemResponse = {
      ...RES,
      endAt: '2026-12-01T12:30:00.000Z',
      classId: 'c1',
      performanceId: 'p9',
    };
    // Act
    const form = toScheduleFormInput(fromScheduleItemResponse(res));
    const body = toScheduleUpsertRequest(form);
    // Assert
    expect(form).toMatchObject({
      endAt: '2026-12-01T21:30',
      performanceId: 'p9',
      classId: 'c1',
    });
    expect(body).toMatchObject({
      startAt: '2026-12-01T19:00:00+09:00',
      endAt: '2026-12-01T21:30:00+09:00',
      performanceId: 'p9',
      classId: 'c1',
    });
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

  it('U29 취소 필드가 없는 옛 응답은 진행 일정(ACTIVE)으로 맞춘다', () => {
    // Arrange
    const old = { ...RES } as Partial<ScheduleItemResponse>;
    delete old.status;
    delete old.cancelReason;
    delete old.observationClosed;
    // Act
    const schedule = fromScheduleItemResponse(old as ScheduleItemResponse);
    // Assert
    expect(schedule.status).toBe('ACTIVE');
    expect(schedule.cancelReason).toBeNull();
    expect(schedule.observationClosed).toBeNull();
  });

  it('취소 요청은 사유를 trim 하고, 연습·공연만 참관 받지 않음 값을 보낸다', () => {
    // Act
    const practice = toScheduleCancelRequest({
      reason: '  공연 단체관람 ',
      observationClosed: true,
      type: 'PRACTICE',
    });
    const event = toScheduleCancelRequest({
      reason: '우천',
      observationClosed: true,
      type: 'EVENT',
    });
    // Assert
    expect(practice).toEqual({
      reason: '공연 단체관람',
      observationClosed: true,
    });
    expect(event).toEqual({ reason: '우천', observationClosed: false });
  });
});
