// ----------------------------------------------------------------------
// 목 백엔드 라우터 — BFF(src/server/upstream.ts)가 MOCK_BACKEND=true 일 때만 부른다.
// 관리 API 는 Bearer 세션이 없으면 401 AUTH_003(가드가 400·404 보다 먼저 — develop §3.1).
// 없는 경로는 404 COMMON_002.
// ----------------------------------------------------------------------
import { applicationRoutes } from '@/src/_mock/backend/handlers/applications';
import { authRoutes } from '@/src/_mock/backend/handlers/auth';
import { dashboardRoutes } from '@/src/_mock/backend/handlers/dashboard';
import { galleryRoutes } from '@/src/_mock/backend/handlers/galleries';
import { memberRoutes } from '@/src/_mock/backend/handlers/members';
import { performanceRoutes } from '@/src/_mock/backend/handlers/performances';
import { popupRoutes } from '@/src/_mock/backend/handlers/popups';
import { scheduleRoutes } from '@/src/_mock/backend/handlers/schedules';
import { staffRoutes } from '@/src/_mock/backend/handlers/staff';
import { systemRoutes } from '@/src/_mock/backend/handlers/system';
import { uploadRoutes } from '@/src/_mock/backend/handlers/uploads';
import {
  apiError,
  type MockRequest,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';

const ROUTES: MockRoute[] = [
  ...systemRoutes,
  ...authRoutes,
  ...uploadRoutes,
  ...dashboardRoutes,
  ...performanceRoutes,
  ...memberRoutes,
  ...applicationRoutes,
  ...galleryRoutes,
  ...scheduleRoutes,
  ...staffRoutes,
  ...popupRoutes,
];

function parseJson(req: MockRequest): Record<string, unknown> {
  if (
    !req.body ||
    req.body.byteLength === 0 ||
    !req.contentType?.includes('json')
  )
    return {};
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(req.body));
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function isSessionValid(token: string | null): boolean {
  if (!token) return false;
  const expiresAt = getStore().sessions.get(token);
  return expiresAt !== undefined && expiresAt > Date.now();
}

export async function handleMockRequest(req: MockRequest): Promise<Response> {
  const pathMatches = ROUTES.filter((r) => r.pattern.test(req.path));
  const route = pathMatches.find((r) => r.method === req.method);
  const ctx = { req };
  if (!route)
    return apiError(ctx, 404, 'COMMON_002', '요청한 정보를 찾을 수 없습니다.');
  if (route.auth && !isSessionValid(req.token)) {
    return apiError(ctx, 401, 'AUTH_003', '로그인이 필요합니다.');
  }
  const match = route.pattern.exec(req.path);
  return route.handle({
    req,
    params: { ...(match?.groups ?? {}) },
    query: new URLSearchParams(req.search),
    body: parseJson(req),
  });
}
