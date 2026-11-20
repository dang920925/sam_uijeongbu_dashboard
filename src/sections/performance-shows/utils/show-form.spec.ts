import { describe, expect, it } from 'vitest';

import { EMPTY_SHOW_FORM } from '@/src/api/show-mapper';
import {
  hasShowFormError,
  validateShowForm,
} from '@/src/sections/performance-shows/utils/show-form';

const VALID = {
  ...EMPTY_SHOW_FORM,
  showDate: '2026-12-12',
  startTime: '14:00',
};

describe('show-form', () => {
  it('날짜·시작 시각이 비면 각각 필수 문구를 돌려준다', () => {
    // Act
    const errors = validateShowForm(EMPTY_SHOW_FORM);
    // Assert
    expect(errors.showDate).toBe('날짜를 입력해주세요');
    expect(errors.startTime).toBe('시작 시각을 입력해주세요');
    expect(hasShowFormError(errors)).toBe(true);
  });

  it('날짜·시작 시각만 있으면 오류가 없다(나머지는 비워 둘 수 있다)', () => {
    expect(hasShowFormError(validateShowForm(VALID))).toBe(false);
  });

  it('좌석 수는 0~10000 정수만 통과한다', () => {
    expect(validateShowForm({ ...VALID, totalSeats: '10001' }).totalSeats).toBe(
      '입력값을 확인해주세요.'
    );
    expect(
      validateShowForm({ ...VALID, totalSeats: '0' }).totalSeats
    ).toBeNull();
  });

  it('예매 오픈 날짜·시각은 둘 다 넣거나 둘 다 비워야 한다', () => {
    expect(
      validateShowForm({ ...VALID, bookingOpenDate: '2026-12-01' })
        .bookingOpenTime
    ).toBe('입력값을 확인해주세요.');
    expect(
      validateShowForm({ ...VALID, bookingOpenTime: '20:00' }).bookingOpenDate
    ).toBe('입력값을 확인해주세요.');
    expect(
      hasShowFormError(
        validateShowForm({
          ...VALID,
          bookingOpenDate: '2026-12-01',
          bookingOpenTime: '20:00',
        })
      )
    ).toBe(false);
  });
});
