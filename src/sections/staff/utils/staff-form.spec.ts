import { describe, expect, it } from 'vitest';

import {
  createEmptyStaffForm,
  hasStaffFormError,
  nextDisplayOrder,
  validateStaffForm,
} from '@/src/sections/staff/utils/staff-form';

describe('staff-form', () => {
  it('이름·역할이 비었거나 공백뿐이면 각각 필수 문구를 돌려준다', () => {
    // Arrange
    const form = { ...createEmptyStaffForm(0), name: '  ' };
    // Act
    const errors = validateStaffForm(form);
    // Assert
    expect(errors).toEqual({
      name: '이름을 입력해주세요',
      role: '역할을 입력해주세요',
      histories: [],
    });
    expect(hasStaffFormError(errors)).toBe(true);
  });

  it('이름·역할이 있으면 오류가 없다', () => {
    const errors = validateStaffForm({
      ...createEmptyStaffForm(0),
      name: '홍',
      role: '연출',
    });
    expect(hasStaffFormError(errors)).toBe(false);
  });

  it('새 연출진 노출 순서는 가장 큰 값 + 1, 빈 목록이면 0 이고 노출은 켠 상태로 시작한다', () => {
    expect(nextDisplayOrder([])).toBe(0);
    expect(nextDisplayOrder([0, 3, 1])).toBe(4);
    expect(createEmptyStaffForm(4)).toMatchObject({
      displayOrder: '4',
      isVisible: true,
    });
  });
});
