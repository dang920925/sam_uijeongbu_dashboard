// ----------------------------------------------------------------------
// 새 accessToken 의 쿠키 만료 시각(U25 FN-41 — 계정 변경 응답에는 expiresAt 이 없다).
// JWT payload 의 `exp`(초)를 서명 검증 없이 읽는다 — 검증은 서버가 매 요청마다 한다. 쿠키 수명만 맞추는 용도.
// 못 읽으면(JWT 형식 아님·exp 없음) 지금 + 7일(FN-08 7일 토큰).
// ----------------------------------------------------------------------

/** FN-08 토큰 수명 7일 */
export const TOKEN_FALLBACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return atob(padded);
  } catch {
    return null;
  }
}

/** JWT payload 의 exp(초) — 없거나 형식이 틀리면 null */
export function readJwtExp(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  const json = decodeBase64Url(parts[1]);
  if (json === null) return null;
  try {
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== 'object' || payload === null) return null;
    const exp = (payload as { exp?: unknown }).exp;
    return typeof exp === 'number' && Number.isFinite(exp) && exp > 0
      ? exp
      : null;
  } catch {
    return null;
  }
}

/** 쿠키 만료 시각(ISO) — exp 가 있으면 그 시각, 없으면 now + 7일 */
export function tokenExpiresAt(token: string, now: Date = new Date()): string {
  const exp = readJwtExp(token);
  return new Date(
    exp === null ? now.getTime() + TOKEN_FALLBACK_TTL_MS : exp * 1000
  ).toISOString();
}
