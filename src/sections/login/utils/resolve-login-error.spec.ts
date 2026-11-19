import { describe, expect, it } from 'vitest';

import { ApiError } from '@/src/lib/api-client';
import { resolveLoginError } from '@/src/sections/login/utils/resolve-login-error';

function payload(statusCode: number, code: string, message: string) {
  return {
    statusCode,
    status: 'Error',
    message,
    code,
    timestamp: '2026-11-19T00:00:00.000Z',
    path: '/api/v1/auth/login',
  };
}

describe('resolveLoginError', () => {
  it('오류가 없으면 null 을 돌려준다', () => {
    expect(resolveLoginError(null)).toBeNull();
  });

  it('401 은 현행 실패 박스 문구로 바꾼다', () => {
    // Arrange
    const error = new ApiError(401, payload(401, 'AUTH_001', '서버 문구'));
    // Act
    const message = resolveLoginError(error);
    // Assert
    expect(message).toBe('아이디 또는 비밀번호가 올바르지 않습니다.');
  });

  it('429 잠금은 서버 message 를 그대로 보인다', () => {
    // Arrange
    const error = new ApiError(
      429,
      payload(
        429,
        'AUTH_002',
        '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    );
    // Act
    const message = resolveLoginError(error);
    // Assert
    expect(message).toBe('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
  });

  it('본문 없는 실패는 서버 오류 문구로 보인다', () => {
    // Act
    const message = resolveLoginError(new ApiError(0, null));
    // Assert
    expect(message).toBe(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  });
});
