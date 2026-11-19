// ----------------------------------------------------------------------
// BFF 로그아웃(FN-08) — 서버 `POST /api/v1/auth/logout`(세션 버전 +1)을 시도하고, 결과와 무관하게 쿠키를 지운다.
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ADMIN_COOKIE, clearAdminCookie } from '@/src/server/auth-cookie';
import { callUpstream } from '@/src/server/upstream';

export const dynamic = 'force-dynamic';

export async function POST() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  if (token) {
    await callUpstream({
      method: 'POST',
      path: '/v1/auth/logout',
      search: '',
      token,
      contentType: null,
      body: null,
    }).catch(() => undefined);
  }
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
  clearAdminCookie(response);
  return response;
}
