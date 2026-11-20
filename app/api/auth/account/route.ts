// ----------------------------------------------------------------------
// BFF 계정 변경(U25, FN-41) — 서버 `PATCH /api/v1/admin/account` → 200 `{ username, accessToken }`.
// 새 accessToken 은 httpOnly 쿠키로만 바꿔 넣고(바꾼 기기는 로그인 유지 — J-45) 본문은 `{ username }` 만 돌려준다.
// 만료 시각은 응답에 없어 JWT exp 를 읽고, 못 읽으면 지금 + 7일(token-expiry).
// 실패(ACC_001~003 · 429 AUTH_002 + Retry-After · 400 COMMON_001)는 본문·상태를 그대로 중계한다.
// 401(세션 만료·다른 기기에서 바뀜)이면 쿠키를 지운다 — 화면은 전역 401 처리로 로그인에 간다.
// 출처·JSON 검사(QA1-005), 중계 비밀·방문자 IP·503 은 login 라우트와 같다.
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import {
  ADMIN_COOKIE,
  clearAdminCookie,
  setAdminCookie,
} from '@/src/server/auth-cookie';
import {
  rejectedRequestResponse,
  relayResponse,
  serviceUnavailableResponse,
} from '@/src/server/relay-response';
import { checkStateChangingRequest } from '@/src/server/request-guard';
import { tokenExpiresAt } from '@/src/server/token-expiry';
import { callUpstream } from '@/src/server/upstream';
import { visitorIpOf } from '@/src/server/visitor-ip';
import type {
  AccountUpdateResponse,
  AccountUpdateUpstreamResponse,
} from '@/src/types/account';

export const dynamic = 'force-dynamic';

function isUpstreamBody(
  value: unknown
): value is AccountUpdateUpstreamResponse {
  if (typeof value !== 'object' || value === null) return false;
  const { username, accessToken } = value as Record<string, unknown>;
  return (
    typeof username === 'string' &&
    typeof accessToken === 'string' &&
    accessToken.length > 0
  );
}

export async function PATCH(request: NextRequest) {
  const body = await request.arrayBuffer();
  const rejection = checkStateChangingRequest(
    'PATCH',
    request.headers,
    request.nextUrl.origin,
    body.byteLength > 0
  );
  if (rejection) {
    return rejectedRequestResponse(rejection, request.nextUrl.pathname);
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  const upstream = await callUpstream({
    method: 'PATCH',
    path: '/v1/admin/account',
    search: '',
    token,
    contentType: 'application/json',
    body,
    visitorIp: visitorIpOf(request.headers),
    bffPath: request.nextUrl.pathname,
  });
  if (!upstream.ok) {
    const failed = await relayResponse(upstream);
    if (upstream.status === 401 && token) clearAdminCookie(failed);
    return failed;
  }

  const data: unknown = await upstream.json().catch(() => null);
  // 계약 밖 응답이면 새 토큰을 알 수 없다 — 서버를 쓸 수 없는 것과 같게 다룬다
  if (!isUpstreamBody(data)) {
    return serviceUnavailableResponse(request.nextUrl.pathname);
  }
  const response = NextResponse.json<AccountUpdateResponse>(
    { username: data.username },
    { headers: { 'cache-control': 'no-store' } }
  );
  setAdminCookie(response, data.accessToken, tokenExpiresAt(data.accessToken));
  return response;
}
