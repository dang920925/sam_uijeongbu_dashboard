// ----------------------------------------------------------------------
// BFF 로그인(FN-08) — 서버 `POST /api/v1/auth/login` → accessToken 을 httpOnly 쿠키로만 저장하고 204.
// 실패(401 AUTH_001 · 429 AUTH_002 + Retry-After)는 본문·상태를 그대로 돌려 화면이 문구를 보인다(B7).
// qa1: 출처·JSON 검사(QA1-005), 중계 비밀 + 방문자 IP 로 login throttler 가 방문자별로 센다(U11),
// 서버에 닿지 못하면 503 COMMON_005(U13 — callUpstream).
// ----------------------------------------------------------------------
import { NextResponse, type NextRequest } from 'next/server';

import { setAdminCookie } from '@/src/server/auth-cookie';
import {
  rejectedRequestResponse,
  relayResponse,
} from '@/src/server/relay-response';
import { checkStateChangingRequest } from '@/src/server/request-guard';
import { callUpstream } from '@/src/server/upstream';
import { visitorIpOf } from '@/src/server/visitor-ip';
import type { LoginResponse } from '@/src/types/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.arrayBuffer();
  const rejection = checkStateChangingRequest(
    'POST',
    request.headers,
    request.nextUrl.origin,
    body.byteLength > 0
  );
  if (rejection) {
    return rejectedRequestResponse(rejection, request.nextUrl.pathname);
  }

  const upstream = await callUpstream({
    method: 'POST',
    path: '/v1/auth/login',
    search: '',
    token: null,
    contentType: 'application/json',
    body,
    visitorIp: visitorIpOf(request.headers),
    bffPath: request.nextUrl.pathname,
  });
  if (!upstream.ok) return relayResponse(upstream);

  const { accessToken, expiresAt } = (await upstream.json()) as LoginResponse;
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
  setAdminCookie(response, accessToken, expiresAt);
  return response;
}
