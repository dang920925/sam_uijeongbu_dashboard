// 서버 응답을 브라우저로 되돌린다 — 응답 헤더도 화이트리스트(content-type·retry-after)만.
import { NextResponse } from 'next/server';

const PASS_HEADERS = ['content-type', 'retry-after', 'content-length'];

export async function relayResponse(upstream: Response): Promise<NextResponse> {
  const headers = new Headers({ 'cache-control': 'no-store' });
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers });
}

/** 계약 모양(A8.5) 오류 본문 — BFF 가 직접 만드는 응답에만 쓴다 */
function errorResponse(
  statusCode: number,
  status: string,
  message: string,
  code: string | undefined,
  path: string
): Response {
  return new Response(
    JSON.stringify({
      statusCode,
      status,
      message,
      ...(code ? { code } : {}),
      timestamp: new Date().toISOString(),
      path,
    }),
    {
      status: statusCode,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}

/** 서버에 닿지 못함(qa1 U13 — develop §3.1 "BFF 서버 연결 실패") */
export function serviceUnavailableResponse(path: string): Response {
  return errorResponse(
    503,
    'Service Unavailable',
    '서비스를 일시적으로 이용할 수 없습니다.',
    'COMMON_005',
    path
  );
}

/** 상태 변경 요청 거부 — 다른 출처(CSRF, 403) / JSON 이 아닌 본문(400 COMMON_001) */
export function rejectedRequestResponse(
  reason: 'cross-site' | 'not-json',
  path: string
): Response {
  return reason === 'cross-site'
    ? errorResponse(
        403,
        'Forbidden',
        '허용되지 않은 요청입니다.',
        undefined,
        path
      )
    : errorResponse(
        400,
        'Bad Request',
        '입력값을 확인해주세요.',
        'COMMON_001',
        path
      );
}
