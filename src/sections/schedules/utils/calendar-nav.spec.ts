import { describe, expect, it } from 'vitest';

import {
  effectiveView,
  monthsForView,
  parseAnchor,
  parseView,
  rangeTitle,
  shiftAnchor,
  toCalendarQuery,
} from '@/src/sections/schedules/utils/calendar-nav';

const TODAY = '2026-11-20';

describe('calendar-nav', () => {
  it('view 기본은 month, 틀린 date 는 오늘이다', () => {
    expect(parseView(null)).toBe('month');
    expect(parseView('week')).toBe('week');
    expect(parseView('day')).toBe('month');
    expect(parseAnchor('2026-13-01', TODAY)).toBe(TODAY);
    expect(parseAnchor('2026-12-06', TODAY)).toBe('2026-12-06');
  });

  it('xs 에서 week 는 month 로 본다', () => {
    expect(effectiveView('week', true)).toBe('month');
    expect(effectiveView('list', true)).toBe('list');
    expect(effectiveView('week', false)).toBe('week');
  });

  it('조회 달 — 2027-02 월 격자는 1·2·3월, 11-29~12-05 주는 11·12월, 목록은 없음(U-9·U-10)', () => {
    expect(monthsForView('month', '2027-02-14')).toEqual([
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
      { year: 2027, month: 3 },
    ]);
    expect(monthsForView('week', '2026-12-01')).toEqual([
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
    ]);
    expect(monthsForView('list', TODAY)).toEqual([]);
  });

  it('‹ › 는 월 = 한 달(12월 → 다음 해 1월), 주 = 7일 움직인다(E-14)', () => {
    expect(shiftAnchor('month', '2026-12-20', 1)).toBe('2027-01-01');
    expect(shiftAnchor('month', '2026-11-20', -1)).toBe('2026-10-01');
    expect(shiftAnchor('week', '2026-11-20', 1)).toBe('2026-11-27');
  });

  it('범위 제목 — 월 "{y}년 {m}월", 주는 달이 바뀌면 끝에도 월을 붙인다', () => {
    expect(rangeTitle('month', '2026-12-06')).toBe('2026년 12월');
    expect(rangeTitle('week', '2026-12-08')).toBe('2026년 12월 6일 – 12일');
    expect(rangeTitle('week', '2026-12-01')).toBe(
      '2026년 11월 29일 – 12월 5일'
    );
  });

  it('URL 은 기본값(month·오늘)을 생략한다', () => {
    expect(toCalendarQuery('month', TODAY, TODAY)).toBe('');
    expect(toCalendarQuery('week', '2026-12-06', TODAY)).toBe(
      '?view=week&date=2026-12-06'
    );
    expect(toCalendarQuery('list', TODAY, TODAY)).toBe('?view=list');
  });
});
