import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  dayOfWeek,
  formatMinutes,
  monthsBetween,
  parseDate,
  startOfWeek,
  toKstMoment,
} from '@/src/sections/schedules/utils/kst-calendar';

describe('kst-calendar', () => {
  it('UTC 2026-11-30 15:30 은 KST 2026-12-01 00:30 이다(U-1)', () => {
    // Act
    const moment = toKstMoment('2026-11-30T15:30:00.000Z');
    // Assert
    expect(moment).toEqual({ date: '2026-12-01', minutes: 30 });
  });

  it('없는 날짜는 null 로 본다', () => {
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('2026-1-01')).toBeNull();
    expect(parseDate('2026-12-31')).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it('날짜·달 이동은 달·연도를 넘긴다', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
    expect(addMonths('2027-01-31', -1)).toBe('2026-12-01');
  });

  it('요일은 일요일이 0 이고 주 시작은 일요일이다', () => {
    expect(dayOfWeek('2026-11-01')).toBe(0);
    expect(startOfWeek('2026-12-02')).toBe('2026-11-29');
  });

  it('범위가 걸치는 달을 모두 돌려준다', () => {
    expect(monthsBetween('2027-01-31', '2027-03-13')).toEqual([
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
      { year: 2027, month: 3 },
    ]);
  });

  it('분을 HH:mm 으로, 하루를 넘으면 접어서 표시한다', () => {
    expect(formatMinutes(19 * 60 + 30)).toBe('19:30');
    expect(formatMinutes(24 * 60 + 30)).toBe('00:30');
  });
});
