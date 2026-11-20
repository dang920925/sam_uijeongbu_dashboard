import { describe, expect, it } from 'vitest';

import {
  formatTierBreakdown,
  fromAdminReservationItemResponse,
  toManualReservationRequest,
  toReservationCode,
  totalQuantityOf,
  type ManualReservationFormInput,
} from '@/src/api/reservation-mapper';
import type { AdminReservationItemResponse } from '@/src/types/booking';

const BASE_FORM: ManualReservationFormInput = {
  showId: 's-1',
  bookerName: ' 홍길동 ',
  bookerPhone: '',
  inviterMemberId: '',
  memo: '  ',
  status: 'CONFIRMED',
  admitNow: '2',
  tierQuantities: { 't-1': '2', 't-2': '0', 't-3': '' },
  useCustom: false,
  customLabel: '',
  customQuantity: '',
  customAmount: '',
  useAmountOverride: false,
  amountOverride: '',
};

describe('toManualReservationRequest', () => {
  it('수량 0·빈 등급은 빼고, 빈 연락처·메모·초대 단원을 null 로, 확정이면 입장 인원을 보낸다', () => {
    // Act
    const req = toManualReservationRequest(BASE_FORM);
    // Assert
    expect(req).toEqual({
      showId: 's-1',
      bookerName: '홍길동',
      bookerPhone: null,
      items: [{ tierId: 't-1', quantity: 2 }],
      customLine: null,
      amountOverride: null,
      status: 'CONFIRMED',
      memo: null,
      inviterMemberId: null,
      admitNow: 2,
    });
  });

  it('직접 입력 줄과 0원 금액 덮어쓰기를 보내고 입금 대기면 admitNow 를 뺀다', () => {
    // Act
    const req = toManualReservationRequest({
      ...BASE_FORM,
      status: 'PENDING',
      tierQuantities: {},
      useCustom: true,
      customLabel: ' ',
      customQuantity: '2',
      customAmount: '0',
      useAmountOverride: true,
      amountOverride: '0',
      memo: '초대 — 연출 지인',
    });
    // Assert
    expect(req.items).toEqual([]);
    expect(req.customLine).toEqual({ quantity: 2, amount: 0 });
    expect(req.amountOverride).toBe(0);
    expect(req).not.toHaveProperty('admitNow');
    expect(req.memo).toBe('초대 — 연출 지인');
  });
});

describe('totalQuantityOf · formatTierBreakdown', () => {
  it('등급 줄과 직접 입력을 합쳐 매수를 세고 "일반 2 · 스태프 1" 로 적는다', () => {
    expect(
      totalQuantityOf({ ...BASE_FORM, useCustom: true, customQuantity: '3' })
    ).toBe(5);
    expect(
      formatTierBreakdown([
        { tierName: '일반', quantity: 2 },
        { tierName: '스태프', quantity: 1 },
      ])
    ).toBe('일반 2 · 스태프 1');
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
  it('공연 id·제목이 없으면 null, 빈 연락처·입금자명은 null 로 채운다', () => {
    // Arrange
    const res = {
      id: 'r-1',
      code: '1234',
      showId: 's-1',
      showDate: '2026-12-12',
      startTime: '14:00',
      quantity: 2,
      amount: 0,
      items: [
        {
          tierId: null,
          tierName: '직접 입력',
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
      bookerPhone: '',
      depositorName: null,
      inviter: null,
      inviterNote: null,
      status: 'CONFIRMED',
      source: 'ADMIN',
      depositDueAt: null,
      deadlinePassed: false,
      confirmedAt: null,
      confirmedBy: 'MANUAL',
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
    expect(model.bookerPhone).toBeNull();
    expect(model.items).toHaveLength(1);
  });
});
