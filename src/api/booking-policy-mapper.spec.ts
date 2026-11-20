import { describe, expect, it } from 'vitest';

import {
  fromBookingPolicyResponse,
  toBookingPolicyFormInput,
  toBookingPolicyUpsertRequest,
} from '@/src/api/booking-policy-mapper';

describe('booking-policy-mapper', () => {
  it('빈 칸은 null, 1인 최대·입금 기한은 정수로 요청을 만든다', () => {
    // Act
    const request = toBookingPolicyUpsertRequest({
      inquiryContact: ' https://open.kakao.com/o/fixture ',
      depositBank: ' fixture-은행 ',
      depositAccountNumber: '',
      depositAccountHolder: '  ',
      maxTicketsPerBooking: '4',
      depositDeadlineHours: '',
      refundPolicyText: ' 첫 줄\n둘째 줄 ',
    });
    // Assert
    expect(request).toEqual({
      inquiryContact: 'https://open.kakao.com/o/fixture',
      depositBank: 'fixture-은행',
      depositAccountNumber: null,
      depositAccountHolder: null,
      maxTicketsPerBooking: 4,
      depositDeadlineHours: null,
      refundPolicyText: '첫 줄\n둘째 줄',
    });
  });

  it('응답의 null 을 화면 모델에 두고 폼 값은 빈 문자열·숫자 문자열로 바꾼다', () => {
    // Arrange
    const response = {
      performanceId: 'p1',
      inquiryContact: null,
      depositBank: null,
      depositAccountNumber: '123-456',
      depositAccountHolder: null,
      maxTicketsPerBooking: 2,
      depositDeadlineHours: 24,
      refundPolicyText: null,
      missingFields: [
        'depositBank',
        'depositAccountHolder',
        'refundPolicyText',
      ],
    };
    // Act
    const policy = fromBookingPolicyResponse(response);
    const form = toBookingPolicyFormInput(policy);
    // Assert
    expect(policy).toEqual(response);
    expect(form).toEqual({
      inquiryContact: '',
      depositBank: '',
      depositAccountNumber: '123-456',
      depositAccountHolder: '',
      maxTicketsPerBooking: '2',
      depositDeadlineHours: '24',
      refundPolicyText: '',
    });
  });
});
