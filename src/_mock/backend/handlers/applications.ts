// ----------------------------------------------------------------------
// 목 신청서(FN-13, D6 승인과 등록 분리) — develop §3.4 "신청서".
// - 승인·거절은 PENDING 에서만(아니면 409 APP_007), processedAt=now. 승인은 단원을 만들지 않는다.
// - 단원으로 등록: ① APPROVED 아님 409 APP_009 ② 연결 단원이 살아 있음 409 APP_008 ③ createMemberRecord 로 생성 후 연결.
//   연결 단원이 소프트 삭제됐으면 다시 등록할 수 있다(연결 교체). 응답 member 는 미삭제 단원 {id,name} 또는 null.
// - 신청은 홈페이지가 만들므로 E2E 시드용 `POST /v1/__mock/seed/applications`(auth:false, 본문 = 신청 일부의 배열)를 둔다.
// ----------------------------------------------------------------------
import {
  createMemberRecord,
  findMember,
  toMemberItem,
} from '@/src/_mock/backend/handlers/members';
import {
  apiError,
  byCreatedDesc,
  json,
  newId,
  nowIso,
  paginate,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type MockApplication } from '@/src/_mock/backend/mock-store';
import type { ApplicationItemResponse } from '@/src/types/application';

const ID = '(?<id>[^/]+)';

function toItem(app: MockApplication): ApplicationItemResponse {
  const { memberId, ...rest } = app;
  const member = memberId ? findMember(memberId) : undefined;
  return {
    ...rest,
    member: member ? { id: member.id, name: member.name } : null,
  };
}

function findApplication(id: string) {
  return getStore().applications.find((a) => a.id === id);
}

function notFound(ctx: MockContext): Response {
  return apiError(ctx, 404, 'APP_001', '참관 신청 정보를 찾을 수 없습니다.');
}

function processApplication(
  ctx: MockContext,
  status: 'APPROVED' | 'REJECTED'
): Response {
  const app = findApplication(ctx.params.id);
  if (!app) return notFound(ctx);
  if (app.status !== 'PENDING')
    return apiError(ctx, 409, 'APP_007', '이미 처리된 신청입니다.');
  app.status = status;
  app.processedAt = nowIso();
  return json({ application: toItem(app) });
}

function toSeedApplication(input: Record<string, unknown>): MockApplication {
  const pick = <T>(key: string, fallback: T): T =>
    key in input ? (input[key] as T) : fallback;
  return {
    id: pick('id', newId()),
    appType: pick('appType', 'WORK_OBSERVATION'),
    applicantName: pick('applicantName', ''),
    phone: pick('phone', ''),
    performance: pick('performance', null),
    preferredDate: pick('preferredDate', null),
    preferredTime: pick('preferredTime', null),
    motivation: pick('motivation', null),
    consultationMethod: pick('consultationMethod', null),
    question: pick('question', null),
    age: pick('age', null),
    gender: pick('gender', null),
    status: pick('status', 'PENDING'),
    processedAt: pick('processedAt', null),
    createdAt: pick('createdAt', nowIso()),
    memberId: pick('memberId', null),
  };
}

export const applicationRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: /^\/v1\/__mock\/seed\/applications$/,
    auth: false,
    handle: (ctx) => {
      const body: unknown = ctx.body;
      const list = Array.isArray(body)
        ? (body as Record<string, unknown>[])
        : [];
      const created = list.map(toSeedApplication);
      getStore().applications.push(...created);
      return json({ items: created.map(toItem) }, 201);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/applications$/,
    auth: true,
    handle: (ctx) => {
      const appType = ctx.query.get('appType');
      const status = ctx.query.get('status');
      const items = getStore()
        .applications.filter(
          (a) =>
            (!appType || a.appType === appType) &&
            (!status || a.status === status)
        )
        .sort(byCreatedDesc)
        .map(toItem);
      return json(paginate(items, ctx.query));
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/applications\/pending-count$/,
    auth: true,
    handle: (ctx) => {
      const appType = ctx.query.get('appType');
      const count = getStore().applications.filter(
        (a) => a.status === 'PENDING' && (!appType || a.appType === appType)
      ).length;
      return json({ count });
    },
  },
  {
    method: 'GET',
    pattern: new RegExp(`^/v1/admin/applications/${ID}$`),
    auth: true,
    handle: (ctx) => {
      const app = findApplication(ctx.params.id);
      return app ? json(toItem(app)) : notFound(ctx);
    },
  },
  {
    method: 'POST',
    pattern: new RegExp(`^/v1/admin/applications/${ID}/approve$`),
    auth: true,
    handle: (ctx) => processApplication(ctx, 'APPROVED'),
  },
  {
    method: 'POST',
    pattern: new RegExp(`^/v1/admin/applications/${ID}/reject$`),
    auth: true,
    handle: (ctx) => processApplication(ctx, 'REJECTED'),
  },
  {
    method: 'POST',
    pattern: new RegExp(`^/v1/admin/applications/${ID}/member$`),
    auth: true,
    handle: (ctx) => {
      const app = findApplication(ctx.params.id);
      if (!app) return notFound(ctx);
      if (app.status !== 'APPROVED')
        return apiError(
          ctx,
          409,
          'APP_009',
          '승인된 신청만 단원으로 등록할 수 있습니다.'
        );
      if (app.memberId && findMember(app.memberId))
        return apiError(
          ctx,
          409,
          'APP_008',
          '이미 단원으로 등록된 신청입니다.'
        );
      const created = createMemberRecord(ctx, ctx.body);
      if (created instanceof Response) return created;
      app.memberId = created.id;
      return json(
        { application: toItem(app), member: toMemberItem(created) },
        201
      );
    },
  },
];
