import { describe, expect, it } from 'vitest';

import type { ManualReservationFormInput } from '@/src/api/reservation-mapper';
import {
  hasErrors,
  seatsBlockMessage,
  toEffectiveManualInput,
  validateManualReservation,
  validateReservationLines,
} from '@/src/components/manual-reservation-dialog/validate-manual-reservation';
import { MSG_D12 } from '@/src/shared/messages/d12';

const VALID: ManualReservationFormInput = {
  showId: 's-1',
  bookerName: '홍길동',
  bookerPhone: '',
  inviterMemberId: null,
  memo: '',
  status: 'PENDING',
  admitNow: '',
  tierQuantities: { 't-1': '2' },
  useCustom: false,
  customLabel: '',
  customQuantity: '',
  customAmount: '',
  useAmountOverride: false,
  amountOverride: '',
};

describe('validateManualReservation', () => {
  it('등급 2매 · 연락처 없음이면 오류가 없다', () => {
    expect(hasErrors(validateManualReservation(VALID))).toBe(false);
  });

  it('직접 입력 2매 · 0원 · 확정 · 입장 0명을 허용한다', () => {
    // Arrange
    const input = {
      ...VALID,
      tierQuantities: {},
      useCustom: true,
      customQuantity: '2',
      customAmount: '0',
      status: 'CONFIRMED' as const,
      admitNow: '0',
    };
    // Act · Assert
    expect(hasErrors(validateManualReservation(input))).toBe(false);
  });

  it('회차·이름이 비면 각각 문구를 준다', () => {
    const errors = validateManualReservation({
      ...VALID,
      showId: '',
      bookerName: '  ',
    });
    expect(errors.showId).toBe(MSG_D12.ERR_SHOW);
    expect(errors.bookerName).toBe(MSG_D12.ERR_NAME);
  });

  it('연락처 형식이 틀리면 오류, 비어 있으면 통과한다', () => {
    expect(
      validateManualReservation({ ...VALID, bookerPhone: '1234' }).bookerPhone
    ).toBe(MSG_D12.ERR_PHONE);
    expect(
      validateManualReservation({ ...VALID, bookerPhone: '010-1234-5678' })
        .bookerPhone
    ).toBeNull();
  });

  it('입장 인원이 매수를 넘으면 오류를 준다(확정일 때만)', () => {
    const confirmed = { ...VALID, status: 'CONFIRMED' as const, admitNow: '3' };
    expect(validateManualReservation(confirmed).admitNow).toBe(
      MSG_D12.ERR_ADMIT(2)
    );
    expect(
      validateManualReservation({ ...confirmed, status: 'PENDING' }).admitNow
    ).toBeNull();
  });
});

describe('validateReservationLines', () => {
  it('줄 합계가 0매거나 20매를 넘으면 매수 오류를 준다', () => {
    expect(
      validateReservationLines({ ...VALID, tierQuantities: {} }).lines
    ).toBe(MSG_D12.ERR_QTY);
    expect(
      validateReservationLines({ ...VALID, tierQuantities: { a: '21' } }).lines
    ).toBe(MSG_D12.ERR_QTY);
  });

  it('금액 덮어쓰기는 0 이상 숫자만 받는다', () => {
    const on = { ...VALID, useAmountOverride: true };
    expect(
      validateReservationLines({ ...on, amountOverride: '' }).amountOverride
    ).toBe(MSG_D12.ERR_AMOUNT);
    expect(
      validateReservationLines({ ...on, amountOverride: '0' }).amountOverride
    ).toBeNull();
  });

  it('직접 입력 이름이 30자를 넘으면 오류를 준다', () => {
    const errors = validateReservationLines({
      ...VALID,
      useCustom: true,
      customLabel: '가'.repeat(31),
      customQuantity: '1',
      customAmount: '0',
    });
    expect(errors.customLabel).toBe(MSG_D12.ERR_LABEL_LONG);
  });
});

describe('seatsBlockMessage', () => {
  it('남은 좌석보다 많으면 문구, 좌석 미정이면 null 을 준다', () => {
    expect(seatsBlockMessage(3, 2)).toBe(MSG_D12.ERR_SEATS(2));
    expect(seatsBlockMessage(2, 2)).toBeNull();
    expect(seatsBlockMessage(50, null)).toBeNull();
  });
});

describe('toEffectiveManualInput', () => {
  it('직접 입력 방식이면 등급 수량을 비우고 직접 입력 줄을 켠다', () => {
    const input = toEffectiveManualInput(
      { ...VALID, customQuantity: '2', customAmount: '0' },
      'custom',
      false
    );
    expect(input.tierQuantities).toEqual({});
    expect(input.useCustom).toBe(true);
    expect(input.admitNow).toBe('2');
  });

  it('입장 인원을 손댔으면 그 값을 그대로 둔다', () => {
    const input = toEffectiveManualInput(
      { ...VALID, admitNow: '1', useCustom: true },
      'tier',
      true
    );
    expect(input.useCustom).toBe(false);
    expect(input.admitNow).toBe('1');
  });
});
