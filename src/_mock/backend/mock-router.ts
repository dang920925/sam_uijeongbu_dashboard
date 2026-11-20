// ----------------------------------------------------------------------
// 목 백엔드 라우터 — BFF(src/server/upstream.ts)가 MOCK_BACKEND=true 일 때만 부른다.
// 관리 API 는 Bearer 세션이 없으면 401 AUTH_003(가드가 400·404 보다 먼저 — develop §3.1).
// 없는 경로는 404 COMMON_002.
// ----------------------------------------------------------------------
import { accountRoutes } from '@/src/_mock/backend/handlers/account';
import { admissionRoutes } from '@/src/_mock/backend/handlers/admission';
import { applicationRoutes } from '@/src/_mock/backend/handlers/applications';
import { authRoutes } from '@/src/_mock/backend/handlers/auth';
import { dashboardRoutes } from '@/src/_mock/backend/handlers/dashboard';
import { galleryRoutes } from '@/src/_mock/backend/handlers/galleries';
import { inviteCodeRoutes } from '@/src/_mock/backend/handlers/invite-codes';
import { memberRoutes } from '@/src/_mock/backend/handlers/members';
import { performanceRoutes } from '@/src/_mock/backend/handlers/performances';
import { popupRoutes } from '@/src/_mock/backend/handlers/popups';
import { priceTierRoutes } from '@/src/_mock/backend/handlers/price-tiers';
import { pushRoutes } from '@/src/_mock/backend/handlers/push';
import { reservationRoutes } from '@/src/_mock/backend/handlers/reservations';
import { scheduleRoutes } from '@/src/_mock/backend/handlers/schedules';
import { showRoutes } from '@/src/_mock/backend/handlers/shows';
import { staffRoutes } from '@/src/_mock/backend/handlers/staff';
import { systemRoutes } from '@/src/_mock/backend/handlers/system';
import { teamAccountRoutes } from '@/src/_mock/backend/handlers/team-accounts';
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
  // R1 예매 묶음 — `members/invite-codes` 가 `members/{id}` 보다 먼저 맞아야 해서 단원 라우트 앞에 둔다
  ...accountRoutes,
  ...pushRoutes,
  ...inviteCodeRoutes,
  ...showRoutes,
  ...priceTierRoutes,
  ...reservationRoutes,
  ...admissionRoutes,
  // U34 — `performances/{id}/team-accounts` 를 공연 라우트보다 먼저
  ...teamAccountRoutes,
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
  const store = getStore();
  const expiresAt = store.sessions.get(token);
  // U25: 발급 당시 sessionVersion 이 지금 계정 버전과 다르면(계정 변경 뒤 다른 기기) 401
  const version = store.sessionVersions.get(token) ?? 0;
  return (
    expiresAt !== undefined &&
    expiresAt > Date.now() &&
    version === store.account.sessionVersion
  );
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
  const fault = getStore().faults.find(
    (f) =>
      f.remaining > 0 &&
      f.method === req.method &&
      new RegExp(f.pattern).test(req.path)
  );
  if (fault) {
    fault.remaining -= 1;
    return apiError(
      ctx,
      fault.status,
      'COMMON_004',
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  }
  const match = route.pattern.exec(req.path);
  return route.handle({
    req,
    params: { ...(match?.groups ?? {}) },
    query: new URLSearchParams(req.search),
    body: parseJson(req),
  });
}
