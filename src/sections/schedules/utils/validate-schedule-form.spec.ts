import { describe, expect, it } from 'vitest';

import { EMPTY_SCHEDULE_FORM } from '@/src/api/schedule-mapper';
import {
  hasScheduleFormErrors,
  validateScheduleForm,
} from '@/src/sections/schedules/utils/validate-schedule-form';

describe('validate-schedule-form', () => {
  it('제목·시작 시간이 비면 현행 필수 문구를 돌려준다', () => {
    // Act
    const errors = validateScheduleForm(EMPTY_SCHEDULE_FORM);
    // Assert
    expect(errors).toEqual({
      title: '제목을 입력해주세요',
      startAt: '시작 시간을 입력해주세요',
      endAt: null,
    });
    expect(hasScheduleFormErrors(errors)).toBe(true);
  });

  it('종료가 시작보다 이르면 SCH_002 문구를 돌려준다', () => {
    // Act
    const errors = validateScheduleForm({
      ...EMPTY_SCHEDULE_FORM,
      title: 'fixture-1-w3-일정',
      startAt: '2026-12-01T19:00',
      endAt: '2026-12-01T18:59',
    });
    // Assert
    expect(errors.endAt).toBe('종료 일시는 시작 일시 이후여야 합니다.');
  });

  it('종료가 시작과 같거나 비어 있으면 통과한다', () => {
    // Arrange
    const base = {
      ...EMPTY_SCHEDULE_FORM,
      title: 'fixture-1-w3-일정',
      startAt: '2026-12-01T19:00',
    };
    // Act & Assert
    expect(
      hasScheduleFormErrors(
        validateScheduleForm({ ...base, endAt: '2026-12-01T19:00' })
      )
    ).toBe(false);
    expect(hasScheduleFormErrors(validateScheduleForm(base))).toBe(false);
  });
});
