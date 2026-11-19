// ----------------------------------------------------------------------
// 서버(또는 목 백엔드)로 요청을 보내는 단일 지점. 경로는 서버 기준 `/v1/...`(앞에 `/api` 를 붙인다).
// 요청 헤더는 화이트리스트(content-type·accept)만 전달하고 Cookie·Host 는 버린다(가이드 A6.2).
// ----------------------------------------------------------------------
import { handleMockRequest } from '@/src/_mock/backend/mock-router';
import { readServerConfig } from '@/src/server/server-config';

export interface UpstreamRequest {
  method: string;
  /** `/v1/admin/performances` 처럼 `/api` 뒤 경로 */
  path: string;
  search: string;
  token: string | null;
  contentType: string | null;
  body: ArrayBuffer | null;
}

export async function callUpstream(req: UpstreamRequest): Promise<Response> {
  const config = readServerConfig();
  if (config.isMockBackend) return handleMockRequest(req);

  const headers = new Headers({ accept: 'application/json' });
  if (req.contentType) headers.set('content-type', req.contentType);
  if (req.token) headers.set('authorization', `Bearer ${req.token}`);
  return fetch(`${config.apiBaseUrl}/api${req.path}${req.search}`, {
    method: req.method,
    headers,
    body: req.body && req.body.byteLength > 0 ? req.body : undefined,
    cache: 'no-store',
    redirect: 'manual',
  });
}
