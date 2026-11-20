import { describe, expect, it } from 'vitest';

import { makeSchedule } from '@/src/sections/schedules/utils/__fixtures__/make-schedule';
import { toScheduleDetail } from '@/src/sections/schedules/utils/schedule-detail';

const NAMES = {
  performances: new Map([['p1', 'Dear···']]),
  classes: new Map([['c1', '토요반']]),
};

describe('schedule-detail', () => {
  it('날짜 시간·장소·연결 공연/반 이름을 만든다', () => {
    // Act
    const detail = toScheduleDetail(
      makeSchedule({
        type: 'SHOW',
        startAt: '2026-12-13T05:00:00.000Z',
        endAt: '2026-12-13T08:00:00.000Z',
        location: '의정부 예술의전당',
        performanceId: 'p1',
        classId: 'c1',
      }),
      NAMES
    );
    // Assert
    expect(detail).toMatchObject({
      typeLabel: '공연',
      typeTone: 'info',
      typeVariant: 'soft',
      whenText: '12월 13일 (일) 14:00 – 17:00',
      location: '의정부 예술의전당',
      linkText: 'Dear··· · 토요반',
      isCancelled: false,
      cancelText: null,
      observationClosed: false,
    });
  });

  it('취소 일정은 "취소 · {사유}" 와 참관 받지 않음을 가진다', () => {
    const detail = toScheduleDetail(
      makeSchedule({
        status: 'CANCELLED',
        cancelReason: '공연 단체관람',
        observationClosed: true,
      }),
      NAMES
    );
    expect(detail).toMatchObject({
      isCancelled: true,
      cancelText: '취소 · 공연 단체관람',
      observationClosed: true,
      linkText: null,
    });
  });

  it('기타 유형은 outline Label 이다', () => {
    expect(
      toScheduleDetail(makeSchedule({ type: 'ETC' }), NAMES)
    ).toMatchObject({ typeVariant: 'outline' });
  });
});
