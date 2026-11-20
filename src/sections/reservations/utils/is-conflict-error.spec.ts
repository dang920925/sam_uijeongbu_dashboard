import { describe, expect, it } from 'vitest';

import { ApiError } from '@/src/lib/api-client';
import { isConflictError } from '@/src/sections/reservations/utils/is-conflict-error';

const errorOf = (code: string) =>
  new ApiError(409, {
    statusCode: 409,
    status: 'CONFLICT',
    message: 'x',
    code,
    timestamp: '',
    path: '',
  } as never);

describe('isConflictError', () => {
  it('RSV_007·RSV_008 만 충돌로 본다', () => {
    expect(isConflictError(errorOf('RSV_007'))).toBe(true);
    expect(isConflictError(errorOf('RSV_008'))).toBe(true);
    expect(isConflictError(errorOf('RSV_009'))).toBe(false);
    expect(isConflictError(new Error('x'))).toBe(false);
  });
});
