// ----------------------------------------------------------------------
// 관리자 세션 쿠키(FN-08) — `__Host-sam_admin` httpOnly · Secure · SameSite=Strict · Path=/.
// 브라우저 JS 는 토큰을 모른다. BFF 프록시가 이 쿠키를 Authorization: Bearer 로 바꿔 서버에 보낸다.
// localhost(http)는 브라우저가 secure context 로 취급해 Secure 쿠키가 동작한다.
// ----------------------------------------------------------------------
import type { NextResponse } from 'next/server';

export const ADMIN_COOKIE = '__Host-sam_admin';

export function setAdminCookie(
  response: NextResponse,
  token: string,
  expiresAt: string
): void {
  const expires = new Date(expiresAt);
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    ...(Number.isNaN(expires.getTime()) ? {} : { expires }),
  });
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
