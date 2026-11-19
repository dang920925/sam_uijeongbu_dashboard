import { describe, expect, it } from 'vitest';

import { shouldRetryQuery } from '@/src/components/query-provider/should-retry-query';
import { ApiError } from '@/src/lib/api-client';

const error = (status: number, code?: string) =>
  new ApiError(status, {
    statusCode: status,
    status: 'x',
    message: 'm',
    code,
    timestamp: '',
    path: '/api/v1/admin/performances',
  });

describe('shouldRetryQuery', () => {
  it('BFF 연결 실패 503 COMMON_005 는 재시도하지 않는다(QA2-007)', () => {
    expect(shouldRetryQuery(0, error(503, 'COMMON_005'))).toBe(false);
  });

  it('4xx 는 재시도하지 않는다', () => {
    expect(shouldRetryQuery(0, error(404, 'PERF_001'))).toBe(false);
  });

  it('그 밖 5xx·네트워크 오류는 한 번만 재시도한다', () => {
    expect(shouldRetryQuery(0, error(500, 'COMMON_004'))).toBe(true);
    expect(shouldRetryQuery(0, error(503))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError(0, null))).toBe(true);
    expect(shouldRetryQuery(1, error(500, 'COMMON_004'))).toBe(false);
  });
});
