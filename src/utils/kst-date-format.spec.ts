import { describe, expect, it } from 'vitest';

import {
  formatCalendarDate,
  formatKstDate,
  formatKstDateTime,
  fromKstDateTimeInput,
  todayKst,
  toKstDateTimeInput,
} from '@/src/utils/kst-date-format';

describe('kst-date-format', () => {
  it('UTC 15시는 KST 다음 날로 표시한다(실행 TZ 가 UTC 여도)', () => {
    expect(formatKstDate('2026-11-19T15:30:00.000Z')).toBe('2026.11.20');
    expect(formatKstDateTime('2026-11-19T15:30:00.000Z')).toBe(
      '2026.11.20 00:30'
    );
  });

  it('값이 없거나 잘못되면 "-" 를 돌려준다', () => {
    expect(formatKstDate(null)).toBe('-');
    expect(formatKstDateTime('not-a-date')).toBe('-');
    expect(formatCalendarDate('2026/11/19')).toBe('-');
  });

  it('달력 날짜는 시간대 변환 없이 점 표기로 바꾼다', () => {
    expect(formatCalendarDate('2026-12-01')).toBe('2026.12.01');
  });

  it('datetime-local 입력과 ISO 를 KST 기준으로 왕복 변환한다', () => {
    // Arrange
    const input = toKstDateTimeInput('2026-12-01T10:00:00.000Z');
    // Act
    const iso = fromKstDateTimeInput(input);
    // Assert
    expect(input).toBe('2026-12-01T19:00');
    expect(iso).toBe('2026-12-01T19:00:00+09:00');
    expect(fromKstDateTimeInput('')).toBeNull();
  });

  it('오늘 KST 날짜를 계산한다', () => {
    expect(todayKst(new Date('2026-11-19T16:00:00.000Z'))).toBe('2026-11-20');
  });
});
