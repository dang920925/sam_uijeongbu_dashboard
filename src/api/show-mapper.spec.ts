import { describe, expect, it } from 'vitest';

import {
  EMPTY_SHOW_FORM,
  fromAdminShowItemResponse,
  toBookingOpenAt,
  toIntOrNull,
  toShowFormInput,
  toShowUpsertRequest,
} from '@/src/api/show-mapper';
import type { AdminShowItemResponse } from '@/src/types/booking';

const RESPONSE: AdminShowItemResponse = {
  id: 's1',
  classId: null,
  showDate: '2026-12-12',
  startTime: '14:00',
  endTime: null,
  venue: 'fixture-소극장',
  status: 'UPCOMING',
  bookingEnabled: false,
  // KST 2026-12-01 20:00
  bookingOpenAt: '2026-12-01T11:00:00.000Z',
  totalSeats: 80,
  pendingQty: 2,
  confirmedQty: 3,
  remainingSeats: 75,
  admittedCount: 0,
  state: 'CLOSED',
  missingFields: [],
};

describe('show-mapper', () => {
  it('폼의 빈 칸은 null, 숫자 칸은 정수, 반 "선택 안 함"은 null 로 요청을 만든다', () => {
    // Arrange
    const form = {
      ...EMPTY_SHOW_FORM,
      showDate: '2026-12-12',
      startTime: '14:00',
      venue: '  ',
      totalSeats: '80',
    };
    // Act
    const request = toShowUpsertRequest(form);
    // Assert
    expect(request).toEqual({
      showDate: '2026-12-12',
      startTime: '14:00',
      endTime: null,
      venue: null,
      classId: null,
      totalSeats: 80,
      bookingOpenAt: null,
      bookingEnabled: true,
      status: 'UPCOMING',
    });
  });

  it('예매 오픈 날짜·시각 두 칸을 KST +09:00 datetime 하나로 합치고, 하나라도 비면 null', () => {
    expect(toBookingOpenAt('2026-12-01', '20:00')).toBe(
      '2026-12-01T20:00:00+09:00'
    );
    expect(toBookingOpenAt('2026-12-01', '')).toBeNull();
    expect(toBookingOpenAt('', '20:00')).toBeNull();
  });

  it('입력칸 문자열을 정수로 바꾸고 비었거나 정수가 아니면 null', () => {
    expect(toIntOrNull(' 12 ')).toBe(12);
    expect(toIntOrNull('')).toBeNull();
    expect(toIntOrNull('1.5')).toBeNull();
    expect(toIntOrNull('abc')).toBeNull();
  });

  it('응답을 화면 모델로 옮기고 수정 폼 값(KST 오픈 날짜·시각 분리)으로 바꾼다', () => {
    // Act
    const show = fromAdminShowItemResponse(RESPONSE);
    const form = toShowFormInput(show);
    // Assert
    expect(show).toEqual(RESPONSE);
    expect(form).toEqual({
      showDate: '2026-12-12',
      startTime: '14:00',
      endTime: '',
      venue: 'fixture-소극장',
      classId: '',
      totalSeats: '80',
      bookingOpenDate: '2026-12-01',
      bookingOpenTime: '20:00',
      bookingEnabled: false,
      status: 'UPCOMING',
    });
  });

  it('오픈 시각이 없으면 폼의 날짜·시각 칸은 빈 문자열이다', () => {
    const form = toShowFormInput(
      fromAdminShowItemResponse({ ...RESPONSE, bookingOpenAt: null })
    );
    expect(form.bookingOpenDate).toBe('');
    expect(form.bookingOpenTime).toBe('');
  });
});
