import { describe, expect, it } from 'vitest';

import {
  isRoomEventId,
  roomRangeFor,
  toRoomCalendarEvents,
} from '@/src/sections/schedules/utils/room-event';

describe('room-event', () => {
  it('팀 예약은 "{팀} 연습실" 칩, (U46) 막은 시간은 제목 칩 + 블록 id·날짜를 담는다', () => {
    const events = toRoomCalendarEvents({
      reservations: [
        {
          id: 'r1',
          startAt: new Date('2026-12-01T10:00:00.000Z'),
          endAt: new Date('2026-12-01T12:00:00.000Z'),
          teamName: 'Dear-B',
          memo: null,
          performanceTitle: 'Dear',
          attendeeNames: ['김가'],
        },
      ],
      blocks: [
        {
          blockId: 'b1',
          title: '고정 사용',
          date: '2026-12-01',
          startAt: new Date('2026-12-01T11:00:00.000Z'),
          endAt: new Date('2026-12-01T15:00:00.000Z'),
        },
      ],
    });
    expect(
      events.map((e) => [
        e.id,
        e.title,
        e.typeLabel,
        e.timeText,
        e.room?.blockId,
      ])
    ).toEqual([
      ['room:r1', 'Dear-B 연습실', '연습실 예약', '19:00 – 21:00', null],
      [
        'room:block:b1:2026-12-01',
        '고정 사용',
        '막은 시간',
        '20:00 – 00:00',
        'b1',
      ],
    ]);
    expect(events[1].room?.blockDate).toBe('2026-12-01');
    expect(events.every((e) => isRoomEventId(e.id))).toBe(true);
  });

  it('주 보기 조회 기간은 주 시작 ~ +7일(KST)', () => {
    expect(roomRangeFor('week', '2026-12-02', '2026-11-23').from).toMatch(
      /T00:00:00\+09:00$/
    );
  });
});
