import { describe, expect, it } from 'vitest';

import type { Show } from '@/src/api/show-mapper';
import {
  formatShowDate,
  toShowRowDisplay,
} from '@/src/sections/performance-shows/utils/show-row';

const SHOW: Show = {
  id: 's1',
  classId: null,
  showDate: '2026-12-12',
  startTime: '14:00',
  endTime: null,
  venue: 'fixture-소극장',
  status: 'UPCOMING',
  bookingEnabled: true,
  teamAccountId: null,
  bookingOpenAt: '2026-12-01T11:00:00.000Z',
  totalSeats: 80,
  pendingQty: 2,
  confirmedQty: 3,
  remainingSeats: 75,
  admittedCount: 0,
  state: 'OPEN',
  missingFields: [],
};

describe('show-row', () => {
  it('KST 달력 날짜에 요일을 붙인다', () => {
    expect(formatShowDate('2026-12-12')).toBe('2026.12.12 (토)');
    expect(formatShowDate('2026-12-13')).toBe('2026.12.13 (일)');
    expect(formatShowDate('bad')).toBe('-');
  });

  it('표·카드 글자를 만든다 — 예매 = 입금 대기 + 확정, 오픈 시각은 KST', () => {
    // Act
    const row = toShowRowDisplay(SHOW);
    // Assert
    expect(row).toMatchObject({
      titleText: '2026.12.12 (토) 14:00',
      venueText: 'fixture-소극장',
      seatsCountsText: '5 / 3 / 75',
      seatsTotalText: '총 80석',
      openText: '2026.12.01 20:00',
      cardMeta: ['fixture-소극장', '오픈 2026.12.01 20:00'],
      cardSeats: ['좌석 80석', '예매 5', '확정 3', '남은 75'],
      stateLabel: '열림',
      stateTone: 'success',
      stateVariant: 'soft',
      missingText: null,
      isStopped: false,
    });
  });

  it('준비 중이면 회차 빈 칸을, 마감은 outline, 예매 중지는 isStopped 로 보인다', () => {
    const notReady = toShowRowDisplay({
      ...SHOW,
      venue: null,
      bookingOpenAt: null,
      totalSeats: null,
      remainingSeats: null,
      state: 'NOT_READY',
      missingFields: [
        'totalSeats',
        'bookingOpenAt',
        'depositBank',
        'basePrice',
      ],
    });
    expect(notReady).toMatchObject({
      venueText: '-',
      openText: '-',
      seatsCountsText: '5 / 3 / -',
      seatsTotalText: '총 -석',
      cardMeta: ['오픈 -'],
      stateLabel: '준비 중',
      missingText: '빈 칸: 좌석 수, 오픈 시각',
    });
    const closed = toShowRowDisplay({
      ...SHOW,
      bookingEnabled: false,
      state: 'CLOSED',
    });
    expect(closed.stateVariant).toBe('outline');
    expect(closed.isStopped).toBe(true);
  });
});
