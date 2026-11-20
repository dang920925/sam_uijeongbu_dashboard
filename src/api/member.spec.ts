import { describe, expect, it } from 'vitest';

import { toMemberNotFoundIfInvalidId } from '@/src/api/member';
import { ApiError } from '@/src/lib/api-client';

describe('toMemberNotFoundIfInvalidId', () => {
  it('상세 조회의 400 COMMON_001(id 형식)을 MEM_001 404 와 같은 문구로 바꾼다', () => {
    const error = toMemberNotFoundIfInvalidId(
      new ApiError(400, {
        statusCode: 400,
        status: 'Bad Request',
        message: 'id 형식이 올바르지 않습니다.',
        code: 'COMMON_001',
        timestamp: 't',
        path: '/api/v1/admin/members/x',
      })
    );
    expect(error instanceof ApiError && error.status).toBe(404);
    expect(error instanceof ApiError && error.message).toBe(
      '단원 정보를 찾을 수 없습니다.'
    );
  });

  it('그 밖의 오류는 그대로 둔다', () => {
    const original = new ApiError(500, null);
    expect(toMemberNotFoundIfInvalidId(original)).toBe(original);
  });
});
