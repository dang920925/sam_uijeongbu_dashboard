import { describe, expect, it } from 'vitest';

import { makeSchedule } from '@/src/sections/schedules/utils/__fixtures__/make-schedule';
import { toCalendarEvents } from '@/src/sections/schedules/utils/calendar-event';
import {
  buildWeek,
  initialScrollMinutes,
  layoutDay,
  weekRange,
} from '@/src/sections/schedules/utils/schedule-week';

const TODAY = '2026-11-20';
/** KST 'YYYY-MM-DD HH:mm' → UTC ISO */
const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`).toISOString();

describe('schedule-week', () => {
  it('주 범위는 일요일~토요일이다', () => {
    expect(weekRange('2026-12-02')).toEqual({
      start: '2026-11-29',
      end: '2026-12-05',
    });
  });

  it('겹치는 19:00–21:00 · 20:00–22:00 은 폭을 1/2 씩 나란히 쓴다(U-11)', () => {
    // Arrange
    const events = toCalendarEvents([
      makeSchedule({
        id: 'a',
        startAt: kst('2026-12-08', '19:00'),
        endAt: kst('2026-12-08', '21:00'),
      }),
      makeSchedule({
        id: 'b',
        startAt: kst('2026-12-08', '20:00'),
        endAt: kst('2026-12-08', '22:00'),
      }),
    ]);
    // Act
    const blocks = layoutDay(events);
    // Assert
    expect(blocks.map((b) => [b.event.id, b.column, b.columns])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
    ]);
    expect(blocks[0]).toMatchObject({ top: 19 * 60, height: 120 });
  });

  it('겹치지 않는 일정은 전체 폭을 쓴다', () => {
    const blocks = layoutDay(
      toCalendarEvents([
        makeSchedule({
          id: 'a',
          startAt: kst('2026-12-08', '10:00'),
          endAt: kst('2026-12-08', '11:00'),
        }),
        makeSchedule({ id: 'b', startAt: kst('2026-12-08', '11:00') }),
      ])
    );
    expect(blocks.map((b) => b.columns)).toEqual([1, 1]);
  });

  it('종료 없는 일정은 60분, 짧은 일정은 최소 30분 높이다(U-12)', () => {
    const blocks = layoutDay(
      toCalendarEvents([
        makeSchedule({ id: 'a', startAt: kst('2026-12-08', '09:00') }),
        makeSchedule({
          id: 'b',
          startAt: kst('2026-12-08', '13:00'),
          endAt: kst('2026-12-08', '13:10'),
        }),
      ])
    );
    expect(blocks.map((b) => b.height)).toEqual([60, 30]);
  });

  it('자정을 넘는 일정은 그 날 끝까지 자르고 다음 날 종료 시각을 둔다', () => {
    const [block] = layoutDay(
      toCalendarEvents([
        makeSchedule({
          startAt: kst('2026-12-08', '22:00'),
          endAt: kst('2026-12-09', '01:30'),
        }),
      ])
    );
    expect(block).toMatchObject({
      top: 22 * 60,
      height: 120,
      overnightEnd: '01:30',
    });
  });

  it('11-29~12-05 주는 두 달 일정을 합쳐 각 날짜 열에 둔다(U-10)', () => {
    const days = buildWeek({
      anchor: '2026-12-02',
      today: TODAY,
      events: toCalendarEvents([
        makeSchedule({ id: 'nov', startAt: kst('2026-11-30', '19:00') }),
        makeSchedule({ id: 'dec', startAt: kst('2026-12-05', '14:00') }),
      ]),
    });
    expect(days.map((d) => d.date)[0]).toBe('2026-11-29');
    expect(days[1].blocks[0].event.id).toBe('nov');
    expect(days[6].blocks[0].event.id).toBe('dec');
    expect(days.map((d) => d.weekday).join('')).toBe('일월화수목금토');
    expect(days[2].slots).toHaveLength(48);
    expect(days[2].slots[39]).toEqual({
      minutes: 19 * 60 + 30,
      ariaLabel: '12월 1일 19:30 일정 추가',
    });
  });

  it('첫 스크롤은 가장 이른 일정 1시간 전, 없으면 09:00 이다', () => {
    const days = buildWeek({
      anchor: '2026-12-06',
      today: TODAY,
      events: toCalendarEvents([
        makeSchedule({ id: 'a', startAt: kst('2026-12-06', '14:00') }),
        makeSchedule({ id: 'b', startAt: kst('2026-12-12', '18:00') }),
      ]),
    });
    expect(initialScrollMinutes(days)).toBe(13 * 60);
    expect(
      initialScrollMinutes(
        buildWeek({ anchor: '2026-12-06', today: TODAY, events: [] })
      )
    ).toBe(9 * 60);
  });
});
