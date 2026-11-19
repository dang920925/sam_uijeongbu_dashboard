// ----------------------------------------------------------------------
// 목 백엔드 응답 도우미 — 오류 본문은 계약 `{ statusCode, status, message, code?, timestamp, path }`(develop §3.1).
// ----------------------------------------------------------------------
import type { UpstreamRequest } from '@/src/server/upstream';
import { getStore } from '@/src/_mock/backend/mock-store';
import type { Paginated } from '@/src/types/common';

export type MockRequest = UpstreamRequest;

export interface MockContext {
  req: MockRequest;
  /** 경로 정규식의 이름 그룹 */
  params: Record<string, string>;
  query: URLSearchParams;
  /** JSON 본문(없으면 {}) */
  body: Record<string, unknown>;
}

export interface MockRoute {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** `/v1/...` 기준 정규식(이름 그룹으로 params) */
  pattern: RegExp;
  /** true 면 Bearer 세션 필요(관리 API — 없으면 401 AUTH_003) */
  auth: boolean;
  handle: (ctx: MockContext) => Response | Promise<Response>;
}

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

export function json(
  body: unknown,
  status = 200,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function apiError(
  ctx: Pick<MockContext, 'req'>,
  statusCode: number,
  code: string,
  message: string,
  headers?: Record<string, string>
): Response {
  return json(
    {
      statusCode,
      status: STATUS_TEXT[statusCode] ?? 'Error',
      message,
      code,
      timestamp: new Date().toISOString(),
      path: `/api${ctx.req.path}`,
    },
    statusCode,
    headers
  );
}

export function validationError(
  ctx: Pick<MockContext, 'req'>,
  message = '입력값을 확인해주세요.'
): Response {
  return apiError(ctx, 400, 'COMMON_001', message);
}

/** UUID v7 흉내(시간 순 정렬 가능) — 목 전용 */
export function newId(): string {
  const store = getStore();
  store.seq += 1;
  const time = Date.now().toString(16).padStart(12, '0');
  const seq = store.seq.toString(16).padStart(12, '0');
  return `${time.slice(0, 8)}-${time.slice(8, 12)}-7000-8000-${seq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function paginate<T>(items: T[], query: URLSearchParams): Paginated<T> {
  const size = Math.min(
    Math.max(Number(query.get('size') ?? 20) || 20, 1),
    100
  );
  const page = Math.max(Number(query.get('page') ?? 1) || 1, 1);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / size));
  return {
    items: items.slice((page - 1) * size, page * size),
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/** createdAt 내림차순 */
export function byCreatedDesc<T extends { createdAt: string }>(
  a: T,
  b: T
): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function isHttpsUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https:\/\//.test(value);
}

/** 목 Storage 공개 URL — BFF 를 거쳐 메모리에서 서빙(실서버는 Supabase 공개 URL) */
export const MOCK_PUBLIC_PREFIX = '/api/backend/__mock-storage/object/';

export function isAllowedImageUrl(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    (value.startsWith(MOCK_PUBLIC_PREFIX) || isHttpsUrl(value))
  );
}
