import { describe, expect, it } from 'vitest';

import type { Reservation } from '@/src/api/reservation-mapper';
import {
  formatShowShort,
  outcomeOf,
  reservationFocusHref,
  resultPrimaryText,
  resultSecondaryText,
  sanitizeCodeInput,
} from '@/src/layouts/admin/quick-search/quick-search-utils';

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    performanceId: 'p1',
    performanceTitle: 'fixture-r1-w4-공연',
    code: '1234',
    showId: 's1',
    showDate: '2099-12-12',
    startTime: '14:00:00',
    quantity: 3,
    amount: 30000,
    items: [
      {
        tierId: 't1',
        tierName: '일반',
        unitPrice: 10000,
        quantity: 2,
        lineAmount: 20000,
        isCustom: false,
        visibility: 'PUBLIC',
      },
      {
        tierId: 't2',
        tierName: '스태프',
        unitPrice: 10000,
        quantity: 1,
        lineAmount: 10000,
        isCustom: false,
        visibility: 'LINK_ONLY',
      },
    ],
    tierTokenUsed: false,
    amountOverridden: false,
    bookerName: '홍길동',
    bookerPhone: '010-0000-0000',
    depositorName: '홍길동1234',
    inviter: null,
    inviterNote: null,
    inviterCategory: null,
    seats: [],
    status: 'PENDING',
    source: 'ONLINE',
    depositDueAt: null,
    deadlinePassed: false,
    confirmedAt: null,
    confirmedBy: null,
    cancelledAt: null,
    cancelReason: null,
    memo: null,
    admittedCount: 0,
    version: 1,
    createdAt: '2099-12-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('quick-search-utils', () => {
  it('입력은 숫자만 4자리까지 남긴다', () => {
    // Arrange · Act · Assert
    expect(sanitizeCodeInput('#12a34')).toBe('1234');
    expect(sanitizeCodeInput('123456')).toBe('1234');
    expect(sanitizeCodeInput('ab')).toBe('');
  });

  it('회차를 "M/D HH:mm" 로 줄여 보인다', () => {
    // Arrange · Act · Assert
    expect(formatShowShort('2099-12-02', '09:30:00')).toBe('12/2 09:30');
    expect(formatShowShort('2099-01-15', '14:00')).toBe('1/15 14:00');
  });

  it('결과 줄은 "공연명 · 회차" / "이름 · 등급별 매수"이고 공연명이 없으면 회차만', () => {
    // Arrange
    const withTitle = reservation();
    const noTitle = reservation({ performanceTitle: null, items: [] });

    // Act · Assert
    expect(resultPrimaryText(withTitle)).toBe(
      'fixture-r1-w4-공연 · 12/12 14:00'
    );
    expect(resultSecondaryText(withTitle)).toBe('홍길동 · 일반 2 · 스태프 1');
    expect(resultPrimaryText(noTitle)).toBe('12/12 14:00');
    expect(resultSecondaryText(noTitle)).toBe('홍길동');
  });

  it('공연 id 를 알면 예매 관리 강조 주소, 모르면 예매 관리 첫 화면이다', () => {
    // Arrange · Act · Assert
    expect(reservationFocusHref(reservation())).toBe(
      '/reservations?performanceId=p1&q=1234'
    );
    expect(reservationFocusHref(reservation({ performanceId: null }))).toBe(
      '/reservations'
    );
  });

  it('건수로 0건·1건·여러 건을 나눈다', () => {
    // Arrange · Act · Assert
    expect(outcomeOf(0)).toBe('none');
    expect(outcomeOf(1)).toBe('one');
    expect(outcomeOf(3)).toBe('many');
  });
});
