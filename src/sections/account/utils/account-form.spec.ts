import { describe, expect, it } from 'vitest';

import {
  describedByOf,
  emptyAccountForm,
  firstErrorField,
  hasAccountError,
  validateAccountForm,
} from '@/src/sections/account/utils/account-form';
import { MSG_D15 } from '@/src/shared/messages/d15';

const CURRENT = 'fixture-r1-w4-admin';
const LONG_PW = 'fixture-r1-w4-password-15+';

function form(overrides: Partial<ReturnType<typeof emptyAccountForm>>) {
  return { ...emptyAccountForm(CURRENT), currentPassword: 'pw', ...overrides };
}

describe('validateAccountForm', () => {
  it('새 아이디만 바꾸면 오류가 없다', () => {
    // Arrange
    const values = form({ newUsername: 'fixture-r1-w4.new_id' });

    // Act
    const errors = validateAccountForm(values, CURRENT);

    // Assert
    expect(hasAccountError(errors)).toBe(false);
  });

  it('현재 비밀번호가 비면 빈 값 문구를 그 칸에 단다', () => {
    // Arrange
    const values = form({
      currentPassword: '',
      newPassword: LONG_PW,
      confirmPassword: LONG_PW,
    });

    // Act
    const errors = validateAccountForm(values, CURRENT);

    // Assert
    expect(errors.fields.currentPassword).toBe(
      MSG_D15.CURRENT_PASSWORD_REQUIRED
    );
    expect(firstErrorField(errors)).toBe('currentPassword');
  });

  it('규칙 밖 아이디(짧음·한글·공백)는 아이디 검증 문구다', () => {
    // Arrange · Act · Assert
    for (const newUsername of ['abc', '관리자1234', 'ad min', 'a'.repeat(51)]) {
      expect(
        validateAccountForm(form({ newUsername }), CURRENT).fields.newUsername
      ).toBe(MSG_D15.INVALID_USERNAME);
    }
  });

  it('새 비밀번호가 15자 미만이면 비밀번호 검증 문구, 빈 칸이면 유지라 오류가 없다', () => {
    // Arrange
    const short = form({
      newPassword: 'a'.repeat(14),
      confirmPassword: 'a'.repeat(14),
    });
    const exact = form({
      newPassword: 'a'.repeat(15),
      confirmPassword: 'a'.repeat(15),
    });

    // Act · Assert
    expect(validateAccountForm(short, CURRENT).fields.newPassword).toBe(
      MSG_D15.INVALID_PASSWORD
    );
    expect(hasAccountError(validateAccountForm(exact, CURRENT))).toBe(false);
  });

  it('확인이 새 비밀번호와 다르면 확인 칸에 불일치 문구를 단다', () => {
    // Arrange
    const values = form({
      newPassword: LONG_PW,
      confirmPassword: `${LONG_PW}x`,
    });

    // Act
    const errors = validateAccountForm(values, CURRENT);

    // Assert
    expect(errors.fields.confirmPassword).toBe(MSG_D15.MISMATCH);
    expect(firstErrorField(errors)).toBe('confirmPassword');
  });

  it('아이디가 그대로(공백만 다름)이고 새 비밀번호가 비면 폼 위에 "바뀐 내용이 없습니다."', () => {
    // Arrange
    const values = form({ newUsername: ` ${CURRENT} ` });

    // Act
    const errors = validateAccountForm(values, CURRENT);

    // Assert
    expect(errors.alert).toEqual({ message: MSG_D15.NO_CHANGE, locked: false });
    expect(firstErrorField(errors)).toBeNull();
  });

  it('현재 아이디를 아직 모르면 바뀐 것 없음을 판단하지 않는다', () => {
    // Arrange
    const values = form({});

    // Act
    const errors = validateAccountForm(values, null);

    // Assert
    expect(hasAccountError(errors)).toBe(false);
  });
});

describe('describedByOf', () => {
  it('도움말·오류 중 있는 것의 id 만 공백으로 잇는다', () => {
    // Arrange · Act · Assert
    expect(describedByOf('f', true, 'err')).toBe('f-helper f-error');
    expect(describedByOf('f', true, undefined)).toBe('f-helper');
    expect(describedByOf('f', false, 'err')).toBe('f-error');
    expect(describedByOf('f', false, undefined)).toBeUndefined();
  });
});
