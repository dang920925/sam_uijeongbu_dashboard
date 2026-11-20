// ----------------------------------------------------------------------
// 공연 요청 함수 — 상세 조회의 엔드포인트·매퍼 호출과 에러 번역(400 COMMON_001 id 형식 → 404).
// 입력은 서버 Response DTO·오류 본문 모양 그대로(server admin-performance-response.dto.ts · http-exception.filter).
// fetch 는 mock 한다.
// ----------------------------------------------------------------------
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPerformance } from '@/src/api/performance';
import { ApiError } from '@/src/lib/api-client';

const ID = '0190f000-0000-7000-8000-000000000301';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function errorBody(statusCode: number, code: string, message: string) {
  return {
    statusCode,
    status: statusCode === 400 ? 'BAD_REQUEST' : 'NOT_FOUND',
    message,
    code,
    timestamp: '2026-11-19T00:00:00.000Z',
    path: `/api/v1/admin/performances/${ID}`,
  };
}

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error: unknown) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('실패해야 합니다.');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPerformance', () => {
  it('BFF 상세 경로를 부르고 서버 응답을 화면 모델로 바꾼다', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: ID,
        title: 'fixture-공연',
        type: 'PLAY',
        status: 'ONGOING',
        isVisible: false,
        posterImageUrl: null,
        createdAt: '2026-11-18T15:30:00.000Z',
        description: null,
        detailImageUrls: [],
        updatedAt: '2026-11-18T15:30:00.000Z',
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    // Act
    const result = await fetchPerformance(ID);
    // Assert
    expect(fetchMock.mock.calls[0][0]).toBe(
      `/api/backend/v1/admin/performances/${ID}`
    );
    expect(result.title).toBe('fixture-공연');
    expect(result.isVisible).toBe(false);
    expect(result.detailImageUrls).toEqual([]);
  });

  it('id 형식 오류(400 COMMON_001)는 404 로 번역하고 서버 본문을 유지한다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            400,
            errorBody(400, 'COMMON_001', 'id 형식이 올바르지 않습니다.')
          )
        )
    );
    // Act
    const error = await catchError(fetchPerformance('not-a-uuid'));
    // Assert
    expect(error.status).toBe(404);
    expect(error.code).toBe('COMMON_001');
    expect(error.message).toBe('id 형식이 올바르지 않습니다.');
  });

  it('없는 공연(404 PERF_001)은 그대로 올린다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            404,
            errorBody(404, 'PERF_001', '작품 정보를 찾을 수 없습니다.')
          )
        )
    );
    // Act
    const error = await catchError(fetchPerformance(ID));
    // Assert
    expect(error.status).toBe(404);
    expect(error.code).toBe('PERF_001');
  });

  it('그 밖의 실패(다른 400 코드·5xx)는 바꾸지 않는다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(
            400,
            errorBody(400, 'UPL_003', '이미지를 업로드해주세요.')
          )
        )
        .mockResolvedValueOnce(new Response('', { status: 500 }))
    );
    // Act
    const badRequest = await catchError(fetchPerformance(ID));
    const serverError = await catchError(fetchPerformance(ID));
    // Assert
    expect(badRequest.status).toBe(400);
    expect(serverError.status).toBe(500);
    expect(serverError.payload).toBeNull();
  });
});
