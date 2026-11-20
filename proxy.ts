// ----------------------------------------------------------------------
// Next 16 proxy(구 middleware) — 세션 쿠키가 없으면 관리 화면 대신 로그인으로 보낸다(SCR-D00 세션).
// 쿠키가 있어도 서버 토큰이 만료됐을 수 있다 → API 401 이면 QueryProvider 가 쿠키를 지우고 로그인으로 1회 이동.
// /login 은 쿠키가 있어도 그대로 둔다(만료 쿠키로 / ↔ /login 을 오가는 고리를 막는다).
// ----------------------------------------------------------------------
import { NextResponse, type NextRequest } from 'next/server';

import { paths } from '@/app/paths';
import { ADMIN_COOKIE } from '@/src/server/auth-cookie';

export function proxy(request: NextRequest) {
  if (request.cookies.has(ADMIN_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = paths.login;
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // API·정적 파일·로그인은 제외. U37: 매니페스트·서비스 워커·홈 화면 아이콘은 로그인 전에도 받아야 한다
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|icons/|login).*)',
  ],
};
