// ----------------------------------------------------------------------
// 서버(또는 목 백엔드)로 요청을 보내는 단일 지점. 경로는 서버 기준 `/v1/...`(앞에 `/api` 를 붙인다).
// 요청 헤더는 화이트리스트(content-type·accept·authorization)만 새로 만들고 Cookie·Host 와 브라우저가 보낸
// `X-Relay-Secret`·`X-Visitor-IP` 는 넘기지 않는다(가이드 A6.2).
// - qa1 U11: 모든 요청에 `X-Relay-Secret`(env RELAY_SECRET) + `X-Visitor-IP`(Vercel 헤더에서 읽은 방문자 IP — 없으면 생략).
//   서버는 비밀이 맞을 때만 그 IP 를 레이트리밋 키로 쓴다(develop §3.1 "방문자 IP 전달").
// - qa1 U13: 서버에 닿지 못하면(네트워크 오류·연결 거부·10초 시간 초과 J-17) 503 COMMON_005 JSON 을 돌려준다.
//   서버가 응답한 오류(4xx·5xx)는 그대로 중계한다. 화면은 이 message 대신 기존 오류 문구를 쓴다.
// ----------------------------------------------------------------------
import { handleMockRequest } from '@/src/_mock/backend/mock-router';
import { serviceUnavailableResponse } from '@/src/server/relay-response';
import { readServerConfig } from '@/src/server/server-config';

/** BFF → 서버 호출 시간 제한(develop J-17) */
export const UPSTREAM_TIMEOUT_MS = 10_000;

export interface UpstreamRequest {
  method: string;
  /** `/v1/admin/performances` 처럼 `/api` 뒤 경로 */
  path: string;
  search: string;
  token: string | null;
  contentType: string | null;
  body: ArrayBuffer | null;
  /** 방문자 IP(visitorIpOf) — 없으면 null 이고 헤더를 보내지 않는다 */
  visitorIp: string | null;
  /** 503 본문의 path(BFF 경로, 쿼리 제외) */
  bffPath: string;
}

/** 서버로 보낼 헤더(화이트리스트 + 중계 비밀·방문자 IP) */
export function buildUpstreamHeaders(
  req: UpstreamRequest,
  relaySecret: string | null
): Headers {
  const headers = new Headers({ accept: 'application/json' });
  if (req.contentType) headers.set('content-type', req.contentType);
  if (req.token) headers.set('authorization', `Bearer ${req.token}`);
  if (relaySecret) headers.set('x-relay-secret', relaySecret);
  if (req.visitorIp) headers.set('x-visitor-ip', req.visitorIp);
  return headers;
}

export async function callUpstream(req: UpstreamRequest): Promise<Response> {
  const config = readServerConfig();
  if (config.isMockBackend) return handleMockRequest(req);

  try {
    return await fetch(`${config.apiBaseUrl}/api${req.path}${req.search}`, {
      method: req.method,
      headers: buildUpstreamHeaders(req, config.relaySecret),
      body: req.body && req.body.byteLength > 0 ? req.body : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    // fetch 는 서버가 응답하면 reject 하지 않는다 — 여기 오는 것은 연결 실패·시간 초과뿐(U13)
    return serviceUnavailableResponse(req.bffPath);
  }
}
