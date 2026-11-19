import { describe, expect, it } from 'vitest';

import { ApiError } from '@/src/lib/api-client';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';

const payload = (statusCode: number, message: string, code: string) => ({
  statusCode,
  status: 'Conflict',
  message,
  code,
  timestamp: '',
  path: '/api/v1/admin/applications/a/member',
});

describe('api-error-message', () => {
  it('서버 오류 본문이 있으면 서버 한국어 message 를 그대로 쓴다', () => {
    const error = new ApiError(
      409,
      payload(409, '이미 단원으로 등록된 신청입니다.', 'APP_008')
    );
    expect(toApiErrorMessage(error)).toBe('이미 단원으로 등록된 신청입니다.');
  });

  it('본문이 없거나 ApiError 가 아니면 COMMON_004 문구를 쓴다', () => {
    expect(toApiErrorMessage(new ApiError(0, null))).toBe(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
    expect(toApiErrorMessage(new Error('x'))).toBe(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  });

  it('404 만 찾을 수 없음으로 본다', () => {
    expect(isNotFoundError(new ApiError(404, null))).toBe(true);
    expect(isNotFoundError(new ApiError(409, null))).toBe(false);
  });
});
