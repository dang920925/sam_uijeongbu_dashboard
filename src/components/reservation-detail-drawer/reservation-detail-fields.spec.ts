import { describe, expect, it } from 'vitest';

import type { Reservation } from '@/src/api/reservation-mapper';
import {
  admissionTextOf,
  appliedPriceTextOf,
  inviterTextOf,
  isFreeReservation,
  toReservationDetailFields,
} from '@/src/components/reservation-detail-drawer/reservation-detail-fields';

const BASE: Reservation = {
  id: 'r-1',
  performanceId: null,
  performanceTitle: null,
  code: '1234',
  showId: 's-1',
  showDate: '2099-12-12',
  startTime: '14:00',
  quantity: 3,
  amount: 30000,
  items: [
    {
      tierId: 't-1',
      tierName: '일반',
      unitPrice: 10000,
      quantity: 2,
      lineAmount: 20000,
      isCustom: false,
      visibility: 'PUBLIC',
    },
    {
      tierId: 't-2',
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
  bookerPhone: null,
  depositorName: null,
  inviter: null,
  appliedPrice: null,
  inviterNote: null,
  inviterCategory: null,
  seats: [],
  status: 'CONFIRMED',
  source: 'ADMIN',
  depositDueAt: null,
  deadlinePassed: false,
  confirmedAt: '2099-12-01T05:00:00Z',
  confirmedBy: 'MANUAL',
  cancelledAt: null,
  cancelReason: null,
  memo: null,
  admittedCount: 1,
  version: 1,
  createdAt: '2099-12-01T04:00:00Z',
};

describe('isFreeReservation', () => {
  it('확정 + 0원이면 무료로 본다', () => {
    expect(isFreeReservation({ status: 'CONFIRMED', amount: 0 })).toBe(true);
    expect(isFreeReservation({ status: 'PENDING', amount: 0 })).toBe(false);
  });
});

describe('inviterTextOf', () => {
  it('배우 이름 · 연출·스태프 · SAM 관계자 > 직접 입력 메모 > - 순으로 보인다(U41)', () => {
    expect(
      inviterTextOf({
        inviter: { kind: 'MEMBER', memberId: 'm', memberName: '김단원' },
        inviterNote: 'x',
      })
    ).toBe('김단원');
    expect(
      inviterTextOf({
        inviter: { kind: 'SAM_RELATED', memberId: null, memberName: null },
      })
    ).toBe('SAM 관계자');
    expect(appliedPriceTextOf({ appliedPrice: 10000 })).toBe('1매 10,000원');
    expect(appliedPriceTextOf({ appliedPrice: null })).toBeNull();
    expect(inviterTextOf({ inviter: null, inviterNote: '연출 지인' })).toBe(
      '연출 지인 (직접 입력)'
    );
    expect(inviterTextOf({ inviter: null, inviterNote: null })).toBe('-');
  });
});

describe('admissionTextOf', () => {
  it('취소 건은 -, 나머지는 a/q 로 보인다', () => {
    expect(admissionTextOf(BASE)).toBe('1/3');
    expect(admissionTextOf({ ...BASE, status: 'CANCELLED' })).toBe('-');
  });
});

describe('toReservationDetailFields', () => {
  it('연락처가 없으면 "연락처 없음", 등급별 매수·총 매수·확정 시각을 만든다', () => {
    // Act
    const fields = toReservationDetailFields(BASE, '공연 A');
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    // Assert
    expect(byKey.perf.value).toBe('공연 A');
    expect(byKey.show.value).toBe('12.12 (토) 14:00');
    expect(byKey.booker.sub).toBe('연락처 없음');
    expect(byKey.tiers.value).toBe('일반 2 · 스태프(링크 전용(할인)) 1');
    expect(byKey.tiers.sub).toBe('총 3매');
    expect(byKey.amount.value).toBe('30,000원');
    expect(byKey.confirmed.value).toBe('2099.12.01 14:00');
    expect(byKey.cancelled).toBeUndefined();
  });

  it('공연명을 모르면 공연 줄을 뺀다', () => {
    expect(
      toReservationDetailFields(BASE, null).some((f) => f.key === 'perf')
    ).toBe(false);
  });
});
