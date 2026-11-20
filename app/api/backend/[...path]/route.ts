// ----------------------------------------------------------------------
// BFF catch-all 프록시(가이드 A6.2) — `/api/backend/v1/...` → 서버 `/api/v1/...`.
// httpOnly 쿠키의 access token 을 Bearer 로 바꿔 붙인다. 서버가 401 이면 쿠키를 지운다(만료·로그아웃된 토큰).
// 갱신 토큰은 없다(develop FN-08 — 7일 토큰, 단일 운영자).
// - 상태 변경(POST·PATCH·PUT·DELETE)은 출처·JSON 검사 뒤에만 중계한다(qa1 QA1-005, request-guard).
// - 중계 비밀·방문자 IP 부착과 서버 연결 실패 503 은 callUpstream 이 한다(qa1 U11·U13).
// - U27(FN-45): `/admin/*` 변경 요청이 2xx 면 응답 뒤 `after()` 로 홈페이지 재검증을 부른다(실패해도 응답 그대로).
// - 슬라이딩 세션(T-PUSH 추가): 쿠키 토큰의 남은 기간이 3일 미만이면 요청마다 1번 서버 refresh → 새 토큰으로 중계하고
//   쿠키를 새 만료(7일)로 바꾼다. refresh 가 실패하면 원래 토큰으로 그대로 진행한다(session-refresh).
// ----------------------------------------------------------------------
import { cookies } from 'next/headers';
import { after, type NextRequest } from 'next/server';

import {
  ADMIN_COOKIE,
  clearAdminCookie,
  setAdminCookie,
} from '@/src/server/auth-cookie';
import {
  rejectedRequestResponse,
  relayResponse,
} from '@/src/server/relay-response';
import { checkStateChangingRequest } from '@/src/server/request-guard';
import {
  refreshSessionToken,
  shouldRefreshSession,
} from '@/src/server/session-refresh';
import {
  notifyClientRevalidate,
  revalidateTargetsFor,
} from '@/src/server/revalidate';
import { readServerConfig } from '@/src/server/server-config';
import { callUpstream } from '@/src/server/upstream';
import { visitorIpOf } from '@/src/server/visitor-ip';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

/** 목 백엔드의 서명 업로드 흉내(`__mock-storage`)만 이미지 본문을 받는다 — 실서버 모드에는 없는 경로 */
function isMockStorageUpload(path: string[]): boolean {
  return path[0] === '__mock-storage' && readServerConfig().isMockBackend;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : null;
  const rejection = checkStateChangingRequest(
    request.method,
    request.headers,
    request.nextUrl.origin,
    (body?.byteLength ?? 0) > 0 && !isMockStorageUpload(path)
  );
  if (rejection) {
    return rejectedRequestResponse(rejection, request.nextUrl.pathname);
  }

  const cookieToken = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  const visitorIp = visitorIpOf(request.headers);
  const refreshed =
    cookieToken && shouldRefreshSession(cookieToken)
      ? await refreshSessionToken({
          token: cookieToken,
          visitorIp,
          bffPath: request.nextUrl.pathname,
        })
      : null;
  const token = refreshed?.accessToken ?? cookieToken;
  const upstreamPath = `/${path.map(encodeURIComponent).join('/')}`;
  const upstream = await callUpstream({
    method: request.method,
    path: upstreamPath,
    search: request.nextUrl.search,
    token,
    contentType: request.headers.get('content-type'),
    body,
    visitorIp,
    bffPath: request.nextUrl.pathname,
  });
  const response = await relayResponse(upstream);
  if (upstream.status === 401 && token) clearAdminCookie(response);
  else if (refreshed) {
    setAdminCookie(response, refreshed.accessToken, refreshed.expiresAt);
  }
  const targets = revalidateTargetsFor(
    request.method,
    upstreamPath,
    upstream.status
  );
  if (targets) after(() => notifyClientRevalidate(targets));
  return response;
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};
