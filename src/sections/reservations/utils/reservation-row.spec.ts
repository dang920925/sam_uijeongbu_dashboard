import { describe, expect, it } from 'vitest';

import type { Reservation } from '@/src/api/reservation-mapper';
import {
  orderWithExactMatch,
  toReservationRow,
} from '@/src/sections/reservations/utils/reservation-row';

const BASE: Reservation = {
  id: 'r-1',
  performanceId: null,
  performanceTitle: null,
  code: '1234',
  showId: 's-1',
  showDate: '2099-12-12',
  startTime: '14:00',
  quantity: 2,
  amount: 0,
  items: [
    {
      tierId: null,
      tierName: '초대',
      unitPrice: 0,
      quantity: 2,
      lineAmount: 0,
      isCustom: true,
      visibility: null,
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
  confirmedAt: null,
  confirmedBy: 'MANUAL',
  cancelledAt: null,
  cancelReason: null,
  memo: '연출 지인',
  admittedCount: 0,
  version: 1,
  createdAt: '2099-12-01T04:00:00Z',
};

describe('toReservationRow', () => {
  it('관리자 등록 0원 확정 건은 무료·관리자 등록·연락처 없음으로 보인다', () => {
    // Act
    const row = toReservationRow(BASE);
    // Assert
    expect(row).toMatchObject({
      phoneText: '연락처 없음',
      showText: '12.12 14:00',
      tierText: '초대 2',
      totalQtyText: '총 2매',
      amountText: '0원',
      depositorText: '-',
      isFree: true,
      isAdmin: true,
      hasMemo: true,
      admissionText: '0/2',
      isLocked: false,
      canEditItems: true,
    });
  });

  it('입금 대기는 기한을, 기한이 지났으면 기한 줄을 빼고, 취소는 사유를 statusNote 로 준다', () => {
    const pending = {
      ...BASE,
      status: 'PENDING' as const,
      depositDueAt: '2099-12-10T05:30:00Z',
    };
    expect(toReservationRow(pending).statusNote).toBe('기한 12.10 14:30');
    expect(
      toReservationRow({ ...pending, deadlinePassed: true }).statusNote
    ).toBeNull();
    expect(
      toReservationRow({
        ...BASE,
        status: 'CANCELLED',
        cancelReason: 'BOOKER_REQUEST',
      })
    ).toMatchObject({
      statusNote: '예매자 요청',
      canEditItems: false,
      admissionText: '-',
    });
  });

  it('입장 인원이 있는 확정 건은 잠근다', () => {
    expect(toReservationRow({ ...BASE, admittedCount: 1 }).isLocked).toBe(true);
  });
});

describe('orderWithExactMatch', () => {
  const items = [
    { id: 'a', code: '5678' },
    { id: 'b', code: '1234' },
  ];

  it('검색어가 예매번호와 같으면 그 행을 맨 위로 올린다', () => {
    const result = orderWithExactMatch(items, ' 1234 ');
    expect(result.items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(result.matchId).toBe('b');
    expect(result.code).toBe('1234');
  });

  it('예매번호 형식이 아니거나 일치가 없으면 순서를 그대로 둔다', () => {
    expect(orderWithExactMatch(items, '홍길동').matchId).toBeNull();
    expect(orderWithExactMatch(items, '9999')).toEqual({
      items,
      matchId: null,
      code: '9999',
    });
  });
});

describe('toReservationRow — U35·U36', () => {
  it('좌석 지정 공연은 "B3·B4" 또는 "좌석 미정", 아니면 null 이고 취소 건은 좌석 변경 불가', () => {
    const seated = toReservationRow(
      {
        ...BASE,
        seats: [
          { rowLabel: 'B', seatNumber: 4 },
          { rowLabel: 'B', seatNumber: 3 },
        ],
      },
      true
    );
    expect(seated.seatText).toBe('B3·B4');
    expect(seated.canChangeSeats).toBe(BASE.status !== 'CANCELLED');
    expect(toReservationRow(BASE, true).seatText).toBe('좌석 미정');
    expect(toReservationRow(BASE, false).seatText).toBeNull();
    expect(
      toReservationRow({ ...BASE, status: 'CANCELLED' }, true).canChangeSeats
    ).toBe(false);
  });

  it('연출·스태프 관계자 초대와 적용 가격을 초대 칸에 적는다(U41)', () => {
    const row = toReservationRow({
      ...BASE,
      inviter: { kind: 'STAFF_RELATED', memberId: null, memberName: null },
      appliedPrice: 20000,
      inviterNote: null,
      inviterCategory: 'STAFF_RELATED',
    });
    expect(row.inviterText).toBe('연출·스태프 관계자');
    expect(row.appliedPriceText).toBe('1매 20,000원');
    expect(row.inviterKind).toBe('STAFF_RELATED');
  });
});
