// ----------------------------------------------------------------------
// BFF 로그인(FN-08) — 서버 `POST /api/v1/auth/login` → accessToken 을 httpOnly 쿠키로만 저장하고 204.
// 실패(401 AUTH_001 · 429 AUTH_002 + Retry-After)는 본문·상태를 그대로 돌려 화면이 문구를 보인다(B7).
// ----------------------------------------------------------------------
import { NextResponse, type NextRequest } from 'next/server';

import { setAdminCookie } from '@/src/server/auth-cookie';
import { relayResponse } from '@/src/server/relay-response';
import { callUpstream } from '@/src/server/upstream';
import type { LoginResponse } from '@/src/types/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const upstream = await callUpstream({
    method: 'POST',
    path: '/v1/auth/login',
    search: '',
    token: null,
    contentType: 'application/json',
    body: await request.arrayBuffer(),
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
