import { describe, expect, it } from 'vitest';

import {
  fromAdminReservationItemResponse,
  toManualReservationRequest,
  toReservationCode,
} from '@/src/api/reservation-mapper';
import type { AdminReservationItemResponse } from '@/src/types/booking';

describe('toManualReservationRequest', () => {
  it('숫자 칸을 정수로, 빈 메모·초대 단원을 null 로 바꾸고 확정이면 입장 인원을 보낸다', () => {
    // Act
    const req = toManualReservationRequest({
      showId: 's-1',
      quantity: '3',
      bookerName: ' 홍길동 ',
      bookerPhone: '010-1234-5678',
      inviterMemberId: '',
      memo: '  ',
      confirmNow: true,
      admitNow: '2',
    });
    // Assert
    expect(req).toEqual({
      showId: 's-1',
      quantity: 3,
      bookerName: '홍길동',
      bookerPhone: '010-1234-5678',
      inviterMemberId: null,
      memo: null,
      confirmNow: true,
      admitNow: 2,
    });
  });

  it('확정하지 않으면 admitNow 를 보내지 않는다', () => {
    // Act
    const req = toManualReservationRequest({
      showId: 's-1',
      quantity: '1',
      bookerName: '김',
      bookerPhone: '01012345678',
      inviterMemberId: 'm-1',
      memo: '현장',
      confirmNow: false,
      admitNow: '1',
    });
    // Assert
    expect(req).not.toHaveProperty('admitNow');
    expect(req.inviterMemberId).toBe('m-1');
    expect(req.memo).toBe('현장');
  });
});

describe('toReservationCode', () => {
  it('4자리 숫자만 예매번호로 본다', () => {
    expect(toReservationCode(' 0123 ')).toBe('0123');
    expect(toReservationCode('#4821')).toBe('4821');
    expect(toReservationCode('123')).toBeNull();
    expect(toReservationCode('홍길동')).toBeNull();
    expect(toReservationCode('12345')).toBeNull();
  });
});

describe('fromAdminReservationItemResponse', () => {
  it('공연 id·제목이 없으면 null 로 채운다', () => {
    // Arrange
    const res = {
      id: 'r-1',
      code: '1234',
      showId: 's-1',
      showDate: '2026-12-12',
      startTime: '14:00',
      quantity: 2,
      unitPrice: 20000,
      amount: 40000,
      bookerName: '홍길동',
      bookerPhone: '010-1234-5678',
      depositorName: '홍길동1234',
      inviter: null,
      inviterNote: null,
      status: 'PENDING',
      source: 'ONLINE',
      depositDueAt: '2026-12-01T00:00:00.000Z',
      deadlinePassed: false,
      confirmedAt: null,
      confirmedBy: null,
      cancelledAt: null,
      cancelReason: null,
      memo: null,
      admittedCount: 0,
      version: 1,
      createdAt: '2026-11-20T00:00:00.000Z',
    } satisfies AdminReservationItemResponse;
    // Act
    const model = fromAdminReservationItemResponse(res);
    // Assert
    expect(model.performanceId).toBeNull();
    expect(model.performanceTitle).toBeNull();
  });
});
