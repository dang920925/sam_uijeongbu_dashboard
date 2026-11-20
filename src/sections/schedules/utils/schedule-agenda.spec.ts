import { describe, expect, it } from 'vitest';

import { makeSchedule } from '@/src/sections/schedules/utils/__fixtures__/make-schedule';
import { toCalendarEvents } from '@/src/sections/schedules/utils/calendar-event';
import { buildAgenda } from '@/src/sections/schedules/utils/schedule-agenda';

describe('schedule-agenda', () => {
  it('그 달에서 일정 있는 날만 날짜순으로 머리 + 행을 만든다', () => {
    // Arrange — 11월 격자 범위의 12월 일정은 아젠다(11월)에 넣지 않는다
    const events = toCalendarEvents([
      makeSchedule({ id: 'b', startAt: '2026-11-20T05:00:00.000Z' }),
      makeSchedule({ id: 'a', startAt: '2026-11-03T11:00:00.000Z' }),
      makeSchedule({ id: 'c', startAt: '2026-11-20T01:00:00.000Z' }),
      makeSchedule({ id: 'x', startAt: '2026-12-02T01:00:00.000Z' }),
    ]);
    // Act
    const days = buildAgenda({
      anchor: '2026-11-15',
      today: '2026-11-20',
      events,
    });
    // Assert
    expect(days.map((d) => [d.date, d.weekday, d.isToday])).toEqual([
      ['2026-11-03', '화', false],
      ['2026-11-20', '금', true],
    ]);
    expect(days[1].events.map((e) => e.id)).toEqual(['c', 'b']);
  });

  it('0건인 달은 빈 배열이다', () => {
    expect(
      buildAgenda({ anchor: '2026-11-01', today: '2026-11-20', events: [] })
    ).toEqual([]);
  });
});
