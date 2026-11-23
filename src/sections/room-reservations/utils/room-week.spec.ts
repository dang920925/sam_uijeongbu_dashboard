import { describe, expect, it } from 'vitest';

import {
  formatWeekTitle,
  kstDateOf,
  toRoomRowDisplay,
  toRoomScheduleRows,
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
          attendeeNames: [],
        },
        '-',
        '체크 안 함'
      )
    ).toEqual({
      id: 'r',
      kind: 'reservation',
      blockId: null,
      date: '2026-12-01',
      startMs: Date.parse('2026-12-01T10:00:00.000Z'),
      dateText: '12.01 (화)',
      timeText: '19:00–21:30',
      teamName: 'Dear-A',
      performanceTitle: 'Dear',
      memo: '-',
      attendeesText: '체크 안 함',
    });
  });

  it('(U45) 참석자가 있으면 인원 수와 이름을 보인다', () => {
    expect(
      toRoomRowDisplay(
        {
          id: 'r',
          startAt: new Date('2026-12-01T10:00:00.000Z'),
          endAt: new Date('2026-12-01T11:00:00.000Z'),
          teamName: 'Dear-A',
          memo: '동선',
          performanceTitle: 'Dear',
          attendeeNames: ['김가', '이나'],
        },
        '-',
        '체크 안 함'
      ).attendeesText
    ).toBe('2명 · 김가, 이나');
  });

  it('(U46) 막은 시간 발생분은 제목을 팀 자리에 두고 예약과 시작 순으로 섞인다', () => {
    const rows = toRoomScheduleRows(
      {
        reservations: [
          {
            id: 'r',
            startAt: new Date('2026-12-01T10:00:00.000Z'),
            endAt: new Date('2026-12-01T11:00:00.000Z'),
            teamName: 'Dear-A',
            memo: null,
            performanceTitle: 'Dear',
            attendeeNames: [],
          },
        ],
        blocks: [
          {
            blockId: 'b1',
            title: '고정 사용',
            date: '2026-12-01',
            startAt: new Date('2026-12-01T01:00:00.000Z'),
            endAt: new Date('2026-12-01T09:00:00.000Z'),
          },
        ],
      },
      {
        noMemo: '-',
        noAttendees: '체크 안 함',
        blockLabel: '막은 시간',
        empty: '-',
      }
    );
    expect(rows.map((r) => [r.kind, r.teamName, r.timeText, r.memo])).toEqual([
      ['block', '고정 사용', '10:00–18:00', '막은 시간'],
      ['reservation', 'Dear-A', '19:00–20:00', '-'],
    ]);
    expect(rows[0]).toMatchObject({ blockId: 'b1', date: '2026-12-01' });
  });
});
