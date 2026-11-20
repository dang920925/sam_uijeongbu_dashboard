import { describe, expect, it } from 'vitest';

import { makeSchedule } from '@/src/sections/schedules/utils/__fixtures__/make-schedule';
import { toCalendarEvents } from '@/src/sections/schedules/utils/calendar-event';
import {
  buildMonthGrid,
  MONTH_CHIPS_LG,
  MONTH_CHIPS_MD,
  monthGridRange,
} from '@/src/sections/schedules/utils/schedule-month';

const TODAY = '2026-11-20';

function dayEvents(count: number) {
  return toCalendarEvents(
    Array.from({ length: count }, (_, i) =>
      makeSchedule({
        id: `e${i}`,
        startAt: `2026-12-03T0${i}:00:00.000Z`,
      })
    )
  );
}

describe('schedule-month', () => {
  it('2026-11 격자는 11-01(일)~12-12(토) 42칸이다(U-9)', () => {
    // Act
    const weeks = buildMonthGrid({
      anchor: '2026-11-20',
      today: TODAY,
      events: [],
      maxChips: MONTH_CHIPS_LG,
    });
    // Assert
    expect(weeks).toHaveLength(6);
    expect(weeks.flat()).toHaveLength(42);
    expect(weeks[0][0].date).toBe('2026-11-01');
    expect(weeks[5][6].date).toBe('2026-12-12');
    expect(weeks[0][0].isOutside).toBe(false);
    expect(weeks[5][6].isOutside).toBe(true);
  });

  it('2027-02 격자는 2027-01-31~03-13 이다(U-9, U-2 앞 빈칸 1칸 = 1월 31일)', () => {
    const range = monthGridRange('2027-02-10');
    expect(range).toEqual({ start: '2027-01-31', end: '2027-03-13' });
    const cells = buildMonthGrid({
      anchor: '2027-02-10',
      today: TODAY,
      events: [],
      maxChips: MONTH_CHIPS_LG,
    }).flat();
    expect(cells.filter((c) => !c.isOutside)).toHaveLength(28);
    expect(cells.findIndex((c) => !c.isOutside)).toBe(1);
  });

  it('lg 는 4건이면 칩 3 + 1개 더, md 는 3건이면 칩 2 + 1개 더(U-3·E-11)', () => {
    const lg = buildMonthGrid({
      anchor: '2026-12-01',
      today: TODAY,
      events: dayEvents(4),
      maxChips: MONTH_CHIPS_LG,
    })
      .flat()
      .find((c) => c.date === '2026-12-03');
    const md = buildMonthGrid({
      anchor: '2026-12-01',
      today: TODAY,
      events: dayEvents(3),
      maxChips: MONTH_CHIPS_MD,
    })
      .flat()
      .find((c) => c.date === '2026-12-03');
    expect(lg?.events).toHaveLength(3);
    expect(lg?.hiddenCount).toBe(1);
    expect(lg?.allEvents).toHaveLength(4);
    expect(md?.events).toHaveLength(2);
    expect(md?.hiddenCount).toBe(1);
  });

  it('칸 aria-label 은 "{y}년 {m}월 {d}일[, 오늘][, 일정 n건]" 이다(U-7)', () => {
    const cells = buildMonthGrid({
      anchor: '2026-11-01',
      today: TODAY,
      events: toCalendarEvents([
        makeSchedule({ startAt: '2026-11-20T01:00:00.000Z' }),
      ]),
      maxChips: MONTH_CHIPS_LG,
    }).flat();
    const today = cells.find((c) => c.date === '2026-11-20');
    const plain = cells.find((c) => c.date === '2026-11-21');
    expect(today?.isToday).toBe(true);
    expect(today?.ariaLabel).toBe('2026년 11월 20일, 오늘, 일정 1건');
    expect(plain?.ariaLabel).toBe('2026년 11월 21일');
    expect(today?.dayTitle).toBe('11월 20일 금요일');
  });
});
