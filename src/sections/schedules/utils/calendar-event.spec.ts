import { describe, expect, it } from 'vitest';

import {
  groupByDate,
  toCalendarEvent,
  toCalendarEvents,
} from '@/src/sections/schedules/utils/calendar-event';
import { makeSchedule } from '@/src/sections/schedules/utils/__fixtures__/make-schedule';

describe('calendar-event', () => {
  it('서버가 startAt 내림차순으로 줘도 하루 안은 오름차순이다(U-4)', () => {
    // Arrange
    const items = [
      makeSchedule({ id: 'c', startAt: '2026-12-03T12:00:00.000Z' }),
      makeSchedule({ id: 'b', startAt: '2026-12-03T05:00:00.000Z' }),
      makeSchedule({ id: 'a', startAt: '2026-12-03T05:00:00.000Z' }),
    ];
    // Act
    const events = toCalendarEvents(items);
    // Assert
    expect(events.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(events.map((e) => e.startTime)).toEqual(['14:00', '14:00', '21:00']);
  });

  it('여러 달 결과를 합칠 때 같은 id 는 한 번만 둔다', () => {
    const events = toCalendarEvents([
      makeSchedule({ id: 'x' }),
      makeSchedule({ id: 'x' }),
    ]);
    expect(events).toHaveLength(1);
  });

  it('KST 날짜로 묶는다(UTC 전날 15:30 → 다음 날 칸, U-1)', () => {
    const map = groupByDate(
      toCalendarEvents([
        makeSchedule({ id: 'n', startAt: '2026-11-30T15:30:00.000Z' }),
      ])
    );
    expect([...map.keys()]).toEqual(['2026-12-01']);
  });

  it('시간 글자 — 같은 날 "HH:mm – HH:mm", 종료 없음 "HH:mm", 다른 날 종료는 날짜까지', () => {
    expect(
      toCalendarEvent(
        makeSchedule({
          startAt: '2026-12-03T11:00:00.000Z',
          endAt: '2026-12-03T13:00:00.000Z',
        })
      )?.timeText
    ).toBe('20:00 – 22:00');
    expect(toCalendarEvent(makeSchedule({}))?.timeText).toBe('20:00');
    expect(
      toCalendarEvent(
        makeSchedule({
          startAt: '2026-12-03T13:00:00.000Z',
          endAt: '2026-12-03T16:00:00.000Z',
        })
      )?.timeText
    ).toBe('22:00 – 2026.12.04 01:00');
  });

  it('칩 aria 는 "{유형} {제목}, {M월 D일} {시간}" 이고 취소면 앞에 "취소된 일정, "', () => {
    const active = toCalendarEvent(makeSchedule({ title: 'HADESTOWN 연습' }));
    const cancelled = toCalendarEvent(
      makeSchedule({
        title: 'HADESTOWN 연습',
        status: 'CANCELLED',
        cancelReason: '공연 단체관람',
      })
    );
    expect(active?.ariaLabel).toBe('연습 HADESTOWN 연습, 12월 3일 20:00');
    expect(cancelled?.ariaLabel).toBe(
      '취소된 일정, 연습 HADESTOWN 연습, 12월 3일 20:00'
    );
    expect(cancelled).toMatchObject({
      isCancelled: true,
      cancelReason: '공연 단체관람',
    });
  });
});
