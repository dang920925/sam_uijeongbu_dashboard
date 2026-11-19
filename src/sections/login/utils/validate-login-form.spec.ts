import { describe, expect, it } from 'vitest';

import {
  hasLoginFormError,
  validateLoginForm,
} from '@/src/sections/login/utils/validate-login-form';

describe('validateLoginForm', () => {
  it('아이디·비밀번호가 비면 현행 빈 값 문구를 돌려준다', () => {
    // Act
    const errors = validateLoginForm({ username: '', password: '' });
    // Assert
    expect(errors).toEqual({
      username: '아이디를 입력해주세요',
      password: '비밀번호를 입력해주세요',
    });
    expect(hasLoginFormError(errors)).toBe(true);
  });

  it('공백만 있는 아이디는 빈 값으로 본다', () => {
    // Act
    const errors = validateLoginForm({ username: '   ', password: 'x' });
    // Assert
    expect(errors.username).toBe('아이디를 입력해주세요');
    expect(errors.password).toBeNull();
  });

  it('공백 비밀번호는 값으로 인정한다', () => {
    // Act
    const errors = validateLoginForm({
      username: 'fixture-admin',
      password: ' ',
    });
    // Assert
    expect(hasLoginFormError(errors)).toBe(false);
  });
});
