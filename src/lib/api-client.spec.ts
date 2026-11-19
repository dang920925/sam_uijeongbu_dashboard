import { ApiError, apiFetch, apiPost, withQuery } from '@/src/lib/api-client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiFetch', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('성공 JSON 을 돌려주고 204 는 undefined 다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(200, { items: [] }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
    );

    // Act
    const ok = await apiFetch('/api/backend/v1/admin/staff');
    const empty = await apiPost('/api/auth/logout');

    // Assert
    expect(ok).toEqual({ items: [] });
    expect(empty).toBeUndefined();
  });

  it('서버 오류 본문은 ApiError 의 status·payload·code 로 남긴다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(404, {
          statusCode: 404,
          status: 'NOT_FOUND',
          message: '연출진 정보를 찾을 수 없습니다.',
          code: 'STF_001',
        })
      )
    );

    // Act
    const error = await apiFetch('/x').catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).code).toBe('STF_001');
    expect((error as ApiError).message).toBe('연출진 정보를 찾을 수 없습니다.');
  });

  it('BFF 503 COMMON_005(서버 연결 실패)는 본문 없는 ApiError — 화면은 기존 공용 문구를 쓴다(U13)', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(503, {
          statusCode: 503,
          status: 'Service Unavailable',
          message: '서비스를 일시적으로 이용할 수 없습니다.',
          code: 'COMMON_005',
        })
      )
    );

    // Act
    const error = await apiFetch('/x').catch((e: unknown) => e);

    // Assert
    expect((error as ApiError).status).toBe(503);
    expect((error as ApiError).payload).toBeNull();
    // 재시도 규칙(should-retry-query)이 알아보도록 code 는 남긴다(qa2 QA2-007)
    expect((error as ApiError).code).toBe('COMMON_005');
  });
});

describe('withQuery', () => {
  it('undefined·null·빈 문자열을 빼고 붙인다', () => {
    expect(withQuery('/a', { page: 2, q: '', t: undefined, s: null })).toBe(
      '/a?page=2'
    );
    expect(withQuery('/a')).toBe('/a');
  });
});
