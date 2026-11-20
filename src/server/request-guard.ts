// ----------------------------------------------------------------------
// 상태 변경 BFF 요청 검사(qa1 QA1-005 — 가이드 server A17.1 "인증(브라우저 쿠키)").
// 세션 쿠키는 SameSite=Strict 라 다른 사이트 요청에 실리지 않지만, 다층 방어로 두 가지를 더 본다.
// ① 출처: `Sec-Fetch-Site` 가 있으면 same-origin(또는 none — 주소창 직접 입력)만, `Origin` 이 있으면 이 앱의 출처만.
//    둘 다 없으면(서버 간 호출·테스트 도구 — 브라우저는 POST·PATCH·DELETE 에 항상 Origin 을 붙인다) 통과.
// ② JSON 전용: 본문이 있는 요청은 Content-Type application/json 만(폼 전송 CSRF 차단).
// GET·HEAD 는 검사하지 않는다(상태를 바꾸지 않음).
// ----------------------------------------------------------------------
const SAFE_METHODS = new Set(['GET', 'HEAD']);
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'none']);

export type RequestRejection = 'cross-site' | 'not-json' | null;

function isJsonContentType(value: string | null): boolean {
  return value?.split(';')[0]?.trim().toLowerCase() === 'application/json';
}

/**
 * 상태 변경 요청을 받아도 되는지 — 거부 사유 또는 null.
 * appOrigin 은 이 BFF 의 출처(request.nextUrl.origin), hasBody 는 본문 바이트가 있는지.
 */
export function checkStateChangingRequest(
  method: string,
  headers: Headers,
  appOrigin: string,
  hasBody: boolean
): RequestRejection {
  if (SAFE_METHODS.has(method.toUpperCase())) return null;
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite && !ALLOWED_FETCH_SITES.has(fetchSite.toLowerCase())) {
    return 'cross-site';
  }
  const origin = headers.get('origin');
  if (origin && origin !== appOrigin) return 'cross-site';
  if (hasBody && !isJsonContentType(headers.get('content-type'))) {
    return 'not-json';
  }
  return null;
}
