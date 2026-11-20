import { describe, expect, it } from 'vitest';

import { ApiError } from '@/src/lib/api-client';
import { resolveAccountError } from '@/src/sections/account/utils/resolve-account-error';
import { MSG_API } from '@/src/shared/messages/common';
import { MSG_D15 } from '@/src/shared/messages/d15';

function apiError(status: number, code: string | undefined, message: string) {
  return new ApiError(status, {
    statusCode: status,
    status: 'x',
    message,
    code,
    timestamp: '2026-11-20T00:00:00.000Z',
    path: '/api/auth/account',
  });
}

describe('resolveAccountError', () => {
  it('ACC_001 은 현재 비밀번호 칸, ACC_002 는 새 아이디 칸에 서버 문구를 단다', () => {
    // Arrange
    const wrong = apiError(
      400,
      'ACC_001',
      '현재 비밀번호가 올바르지 않습니다.'
    );
    const taken = apiError(409, 'ACC_002', '이미 사용 중인 아이디입니다.');

    // Act · Assert
    expect(resolveAccountError(wrong)).toEqual({
      fields: { currentPassword: '현재 비밀번호가 올바르지 않습니다.' },
      alert: null,
    });
    expect(resolveAccountError(taken)).toEqual({
      fields: { newUsername: '이미 사용 중인 아이디입니다.' },
      alert: null,
    });
  });

  it('ACC_003 과 429 잠금은 폼 위 알림(잠금은 locked)이다', () => {
    // Arrange
    const noChange = apiError(400, 'ACC_003', MSG_D15.NO_CHANGE);
    const locked = apiError(
      429,
      'AUTH_002',
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    );

    // Act · Assert
    expect(resolveAccountError(noChange)?.alert).toEqual({
      message: MSG_D15.NO_CHANGE,
      locked: false,
    });
    expect(resolveAccountError(locked)?.alert).toEqual({
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      locked: true,
    });
  });

  it('COMMON_001 검증은 문구로 칸을 고르고, 모르는 문구는 폼 위에 둔다', () => {
    // Arrange
    const id = apiError(400, 'COMMON_001', MSG_D15.INVALID_USERNAME);
    const pw = apiError(400, 'COMMON_001', MSG_D15.INVALID_PASSWORD);
    const other = apiError(400, 'COMMON_001', '입력값을 확인해주세요.');

    // Act · Assert
    expect(resolveAccountError(id)?.fields.newUsername).toBe(
      MSG_D15.INVALID_USERNAME
    );
    expect(resolveAccountError(pw)?.fields.newPassword).toBe(
      MSG_D15.INVALID_PASSWORD
    );
    expect(resolveAccountError(other)?.alert?.message).toBe(
      '입력값을 확인해주세요.'
    );
  });

  it('401 은 전역 처리에 맡겨 null, 본문 없는 실패는 서버 오류 문구다', () => {
    // Arrange
    const unauthorized = apiError(401, 'AUTH_003', '로그인이 필요합니다.');
    const unavailable = new ApiError(503, null, 'COMMON_005');

    // Act · Assert
    expect(resolveAccountError(unauthorized)).toBeNull();
    expect(resolveAccountError(new ApiError(401, null))).toBeNull();
    expect(resolveAccountError(unavailable)?.alert?.message).toBe(
      MSG_API.SERVER_ERROR
    );
    expect(
      resolveAccountError(new TypeError('fetch failed'))?.alert?.message
    ).toBe(MSG_API.SERVER_ERROR);
    expect(resolveAccountError(null)).toBeNull();
  });
});
