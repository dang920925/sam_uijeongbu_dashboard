// ----------------------------------------------------------------------
// 목 신청서(FN-13, D6 승인과 등록 분리) — develop §3.4 "신청서".
// - 승인·거절은 PENDING 에서만(아니면 409 APP_007), processedAt=now. 승인은 단원을 만들지 않는다.
// - 단원으로 등록: ① APPROVED 아님 409 APP_009 ② 연결 단원이 살아 있음 409 APP_008 ③ createMemberRecord 로 생성 후 연결.
//   연결 단원이 소프트 삭제됐으면 다시 등록할 수 있다(연결 교체). 응답 member 는 미삭제 단원 {id,name} 또는 null.
// - U31(develop §15·§15.5): performanceId(참관 작품 ∪ 관심 작품)·contacted·progress 필터, sort(createdAt|progress|contactedAt)·order,
//   PATCH contact(true 면 시각 유지·기록, false 면 NULL·메모 유지, note 생략 = 그대로) · PATCH progress(참관 JOINED·거절 건 409 APP_012),
//   거절 → DROPPED, 상담 단원 등록 → JOINED. U29: scheduleCancellation 은 참관 막은 취소 일정에서 계산.
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
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  kstDate,
  schedulePerformanceId,
} from '@/src/_mock/backend/handlers/schedules';
import { getStore, type MockApplication } from '@/src/_mock/backend/mock-store';
import type { ApplicationItemResponse } from '@/src/types/application';
import {
  APPLICATION_PROGRESSES,
  APPLICATION_PROGRESSES_BY_TYPE,
  type ApplicationProgress,
} from '@/src/types/codes';

const ID = '(?<id>[^/]+)';

/** 참관 날짜·공연이 '참관 막은 취소 일정'과 맞으면 그 일정(U29 — develop §13.2) */
function scheduleCancellationOf(
  app: MockApplication
): ApplicationItemResponse['scheduleCancellation'] {
  if (app.appType !== 'WORK_OBSERVATION' || !app.preferredDate) return null;
  const performanceId = app.performance?.id;
  if (!performanceId) return null;
  const hit = getStore().schedules.find(
    (s) =>
      s.deletedAt === null &&
      s.status === 'CANCELLED' &&
      s.observationClosed === true &&
      kstDate(s.startAt) === app.preferredDate &&
      schedulePerformanceId(s) === performanceId
  );
  return hit ? { scheduleId: hit.id, reason: hit.cancelReason ?? '' } : null;
}

function toItem(app: MockApplication): ApplicationItemResponse {
  const { memberId, ...rest } = app;
  const member = memberId ? findMember(memberId) : undefined;
  return {
    ...rest,
    member: member ? { id: member.id, name: member.name } : null,
    scheduleCancellation: scheduleCancellationOf(app),
  };
}

const PROGRESS_ORDER = new Map(APPLICATION_PROGRESSES.map((p, i) => [p, i]));

function compareBy(
  sort: string | null
): (a: MockApplication, b: MockApplication) => number {
  if (sort === 'progress')
    return (a, b) =>
      (PROGRESS_ORDER.get(a.progress) ?? 0) -
      (PROGRESS_ORDER.get(b.progress) ?? 0);
  if (sort === 'contactedAt')
    // 연락 전(NULL)은 오름차순에서 맨 뒤(서버 NULLS LAST 와 같게)
    return (a, b) =>
      (a.contactedAt ?? '9999').localeCompare(b.contactedAt ?? '9999');
  return (a, b) => a.createdAt.localeCompare(b.createdAt);
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
  if (status === 'REJECTED') {
    app.progress = 'DROPPED';
    app.progressUpdatedAt = nowIso();
  }
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
    interestedPerformances: pick('interestedPerformances', []),
    interestUndecided: pick('interestUndecided', null),
    contactedAt: pick('contactedAt', null),
    contactNote: pick('contactNote', null),
    progress: pick(
      'progress',
      pick<string>('status', 'PENDING') === 'REJECTED' ? 'DROPPED' : 'RECEIVED'
    ),
    progressUpdatedAt: pick('progressUpdatedAt', null),
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
      const performanceId = ctx.query.get('performanceId');
      const contacted = ctx.query.get('contacted');
      const progress = ctx.query.get('progress');
      const sort = ctx.query.get('sort');
      const order = ctx.query.get('order') === 'asc' ? 1 : -1;
      const compare = compareBy(sort);
      const items = getStore()
        .applications.filter(
          (a) =>
            (!appType || a.appType === appType) &&
            (!status || a.status === status) &&
            (!performanceId ||
              a.performance?.id === performanceId ||
              a.interestedPerformances.some((p) => p.id === performanceId)) &&
            (contacted === null ||
              (contacted === 'true') === (a.contactedAt !== null)) &&
            (!progress || a.progress === progress)
        )
        .sort((a, b) => {
          // 같은 값이면 접수 최신순(서버 보조 정렬)
          const primary = sort ? compare(a, b) * order : 0;
          return primary || byCreatedDesc(a, b);
        })
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
      if (app.appType === 'CONSULTATION') {
        app.progress = 'JOINED';
        app.progressUpdatedAt = nowIso();
      }
      return json(
        { application: toItem(app), member: toMemberItem(created) },
        201
      );
    },
  },
  {
    method: 'PATCH',
    pattern: new RegExp(`^/v1/admin/applications/${ID}/contact$`),
    auth: true,
    handle: (ctx) => {
      const app = findApplication(ctx.params.id);
      if (!app) return notFound(ctx);
      if (typeof ctx.body.contacted !== 'boolean') return validationError(ctx);
      if ('note' in ctx.body) {
        const note = str(ctx.body.note)?.trim() || null;
        if (note && note.length > 200)
          return validationError(ctx, '연락 메모는 200자 이내로 입력해주세요.');
        app.contactNote = note;
      }
      app.contactedAt = ctx.body.contacted
        ? (app.contactedAt ?? nowIso())
        : null;
      return json(toItem(app));
    },
  },
  {
    method: 'PATCH',
    pattern: new RegExp(`^/v1/admin/applications/${ID}/progress$`),
    auth: true,
    handle: (ctx) => {
      const app = findApplication(ctx.params.id);
      if (!app) return notFound(ctx);
      const progress = ctx.body.progress as ApplicationProgress;
      if (!APPLICATION_PROGRESSES.includes(progress))
        return validationError(ctx);
      if (
        app.status === 'REJECTED' ||
        !APPLICATION_PROGRESSES_BY_TYPE[app.appType].includes(progress)
      )
        return apiError(
          ctx,
          409,
          'APP_012',
          '이 신청에는 그 진행 단계를 쓸 수 없습니다.'
        );
      app.progress = progress;
      app.progressUpdatedAt = nowIso();
      return json(toItem(app));
    },
  },
];
