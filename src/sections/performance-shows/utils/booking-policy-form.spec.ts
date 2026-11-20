import { describe, expect, it } from 'vitest';

import {
  hasBookingPolicyFormError,
  validateBookingPolicyForm,
} from '@/src/sections/performance-shows/utils/booking-policy-form';

const EMPTY = {
  inquiryContact: '',
  depositBank: '',
  depositAccountNumber: '',
  depositAccountHolder: '',
  maxTicketsPerBooking: '',
  depositDeadlineHours: '',
  refundPolicyText: '',
};
const INVALID = '입력값을 확인해주세요.';

describe('booking-policy-form', () => {
  it('모든 칸이 비어 있어도 저장할 수 있다(비면 예매 준비 중)', () => {
    expect(hasBookingPolicyFormError(validateBookingPolicyForm(EMPTY))).toBe(
      false
    );
  });

  it('계좌번호는 숫자와 - 6~30자만 통과한다', () => {
    const check = (value: string) =>
      validateBookingPolicyForm({ ...EMPTY, depositAccountNumber: value })
        .depositAccountNumber;
    expect(check('3333-01-1234567')).toBeNull();
    expect(check('12345')).toBe(INVALID);
    expect(check('123 456 789')).toBe(INVALID);
  });

  it('1인 최대는 1~20, 입금 기한은 1~168 정수만 통과한다', () => {
    // Act
    const low = validateBookingPolicyForm({
      ...EMPTY,
      maxTicketsPerBooking: '0',
      depositDeadlineHours: '169',
    });
    const ok = validateBookingPolicyForm({
      ...EMPTY,
      maxTicketsPerBooking: '20',
      depositDeadlineHours: '1',
    });
    // Assert
    expect(low).toEqual({
      inquiryContact: null,
      depositAccountNumber: null,
      maxTicketsPerBooking: INVALID,
      depositDeadlineHours: INVALID,
    });
    expect(hasBookingPolicyFormError(ok)).toBe(false);
  });

  it('문의처는 비우거나 전화·글자·https 는 통과, http:·javascript: 등은 어디 있든 막는다(서버 규칙과 같음)', () => {
    const check = (value: string) =>
      validateBookingPolicyForm({ ...EMPTY, inquiryContact: value })
        .inquiryContact;
    expect(check('')).toBeNull();
    expect(check('010-0000-0000 (문자)')).toBeNull();
    expect(check('https://open.kakao.com/o/fixture')).toBeNull();
    expect(check('http://open.kakao.com/o/fixture')).toBe(INVALID);
    expect(check('javascript:alert(1)')).toBe(INVALID);
    expect(check('카톡 문의 http://open.kakao.com/o/x')).toBe(INVALID);
    expect(check('https://a.example/?next=data:text')).toBe(INVALID);
    expect(check('문의: 010-0000-0000')).toBeNull();
  });
});
