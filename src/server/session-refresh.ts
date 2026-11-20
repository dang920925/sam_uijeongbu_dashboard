// ----------------------------------------------------------------------
// 관리자 세션 자동 연장(슬라이딩 세션 — 지휘자 T-PUSH 추가, 사용자 승인 2026-11-20).
// BFF 프록시가 관리자 요청을 처리할 때 쿠키 토큰의 남은 기간이 3일 미만이면 서버 `POST /v1/auth/refresh` 를 1번 불러
// 새 토큰(7일)을 받는다 → 대시보드를 쓰는 동안은 계속 연장되고, 7일 동안 안 쓰면 그대로 만료(로그아웃)된다.
// - 남은 기간은 JWT exp 를 서명 검증 없이 읽는다(검증은 서버 몫). exp 를 못 읽거나 이미 지났으면 연장하지 않는다.
// - 실패(401 — 로그아웃·계정 변경으로 세션 버전이 바뀜, 503 등)면 null → 원래 요청은 원래 토큰으로 그대로 진행한다.
// ----------------------------------------------------------------------
import { readJwtExp } from '@/src/server/token-expiry';
import { callUpstream } from '@/src/server/upstream';
import type { LoginResponse } from '@/src/types/auth';

/** 남은 기간이 이보다 짧으면 연장한다(3일) */
export const SESSION_REFRESH_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

/** 연장할 때인가 — 0 < 남은 기간 < 3일 */
export function shouldRefreshSession(
  token: string,
  now: Date = new Date()
): boolean {
  const exp = readJwtExp(token);
  if (exp === null) return false;
  const remaining = exp * 1000 - now.getTime();
  return remaining > 0 && remaining < SESSION_REFRESH_THRESHOLD_MS;
}

interface RefreshInput {
  token: string;
  visitorIp: string | null;
  bffPath: string;
}

/** 서버에 연장을 요청한다 — 성공하면 새 토큰·만료, 그 밖은 null(던지지 않는다) */
export async function refreshSessionToken(
  input: RefreshInput
): Promise<LoginResponse | null> {
  try {
    const upstream = await callUpstream({
      method: 'POST',
      path: '/v1/auth/refresh',
      search: '',
      token: input.token,
      contentType: null,
      body: null,
      visitorIp: input.visitorIp,
      bffPath: input.bffPath,
    });
    if (!upstream.ok) return null;
    const body = (await upstream.json()) as Partial<LoginResponse>;
    return typeof body.accessToken === 'string' &&
      typeof body.expiresAt === 'string'
      ? { accessToken: body.accessToken, expiresAt: body.expiresAt }
      : null;
  } catch {
    return null;
  }
}
