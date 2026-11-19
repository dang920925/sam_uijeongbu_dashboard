// ----------------------------------------------------------------------
// BFF 로그아웃(FN-08) — 서버 `POST /api/v1/auth/logout`(세션 버전 +1)을 시도하고, 결과와 무관하게 쿠키를 지운다.
// qa1: 다른 출처 요청은 거부(QA1-005 — 남의 사이트가 로그아웃시키지 못하게), 중계 비밀 + 방문자 IP(U11).
// 서버 연결 실패는 callUpstream 이 503 으로 바꾸지만 로그아웃은 그와 무관하게 쿠키를 지운다.
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_COOKIE, clearAdminCookie } from '@/src/server/auth-cookie';
import { rejectedRequestResponse } from '@/src/server/relay-response';
import { checkStateChangingRequest } from '@/src/server/request-guard';
import { callUpstream } from '@/src/server/upstream';
import { visitorIpOf } from '@/src/server/visitor-ip';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rejection = checkStateChangingRequest(
    'POST',
    request.headers,
    request.nextUrl.origin,
    false
  );
  if (rejection) {
    return rejectedRequestResponse(rejection, request.nextUrl.pathname);
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  if (token) {
    await callUpstream({
      method: 'POST',
      path: '/v1/auth/logout',
      search: '',
      token,
      contentType: null,
      body: null,
      visitorIp: visitorIpOf(request.headers),
      bffPath: request.nextUrl.pathname,
    });
  }
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
  clearAdminCookie(response);
  return response;
}
