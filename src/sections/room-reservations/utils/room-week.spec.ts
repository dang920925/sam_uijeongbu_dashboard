import { describe, expect, it } from 'vitest';

import {
  formatWeekTitle,
  kstDateOf,
  toRoomRowDisplay,
  weekRange,
  weekStartOf,
} from '@/src/sections/room-reservations/utils/room-week';

describe('room-week', () => {
  it('주는 월요일 시작이고 범위는 KST 자정 기준이다', () => {
    expect(weekStartOf('2026-11-22')).toBe('2026-11-16');
    expect(weekRange('2026-11-30')).toEqual({
      from: '2026-11-29T15:00:00.000Z',
      to: '2026-12-06T15:00:00.000Z',
    });
    expect(formatWeekTitle('2026-11-30')).toBe('2026.11.30 – 12.06');
  });

  it('UTC 15:00 은 KST 다음 날이다(경계)', () => {
    expect(kstDateOf(new Date('2026-11-30T15:00:00.000Z'))).toBe('2026-12-01');
  });

  it('표 한 줄은 KST 날짜·시간, 메모가 없으면 대체 문자', () => {
    expect(
      toRoomRowDisplay(
        {
          id: 'r',
          startAt: new Date('2026-12-01T10:00:00.000Z'),
          endAt: new Date('2026-12-01T12:30:00.000Z'),
          teamName: 'Dear-A',
          memo: null,
          performanceTitle: 'Dear',
        },
        '-'
      )
    ).toEqual({
      id: 'r',
      dateText: '12.01 (화)',
      timeText: '19:00–21:30',
      teamName: 'Dear-A',
      performanceTitle: 'Dear',
      memo: '-',
    });
  });
});
