// ----------------------------------------------------------------------
// 목 일정(FN-15) — develop §3.4 "일정".
// - 목록: type·year·month(KST 달력 기준) 필터, startAt desc, 페이지. 소프트 삭제 제외.
// - 생성·수정: datetime 은 오프셋 필수 → 출력은 UTC `Z`. endAt < startAt 이면 400 SCH_002.
//   performanceId·classId 는 존재 확인(404 PERF_001 / CLS_001). 없는 일정은 404 SCH_001.
// ----------------------------------------------------------------------
import {
  apiError,
  json,
  newId,
  noContent,
  nowIso,
  paginate,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type SoftDeleted } from '@/src/_mock/backend/mock-store';
import { SCHEDULE_TYPES, type ScheduleType } from '@/src/types/codes';
import type { ScheduleItemResponse } from '@/src/types/content';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

type MockSchedule = SoftDeleted<ScheduleItemResponse>;

function findSchedule(id: string) {
  return getStore().schedules.find((s) => s.id === id && s.deletedAt === null);
}

function toItem(s: MockSchedule): ScheduleItemResponse {
  const { deletedAt: _deletedAt, ...rest } = s;
  return rest;
}

/** 오프셋 있는 datetime → UTC ISO. 형식이 틀리면 undefined */
function toUtcIso(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATETIME_WITH_OFFSET.test(value))
    return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

function kstYearMonth(iso: string): { year: number; month: number } {
  const d = new Date(Date.parse(iso) + KST_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** 본문을 target 에 적용한다. 실패하면 오류 응답 */
function applySchedule(
  ctx: MockContext,
  target: Partial<ScheduleItemResponse>,
  isCreate: boolean
): Response | null {
  const b = ctx.body;
  if (isCreate || 'title' in b) {
    const title = str(b.title)?.trim() ?? '';
    if (title.length < 1 || title.length > 100)
      return validationError(ctx, '제목을 입력해주세요');
    target.title = title;
  }
  if (isCreate || 'type' in b) {
    if (!SCHEDULE_TYPES.includes(b.type as ScheduleType))
      return validationError(ctx);
    target.type = b.type as ScheduleType;
  }
  if (isCreate || 'startAt' in b) {
    const startAt = toUtcIso(b.startAt);
    if (!startAt) return validationError(ctx, '시작 시간을 입력해주세요');
    target.startAt = startAt;
  }
  if ('endAt' in b) {
    if (b.endAt === null || b.endAt === undefined) target.endAt = null;
    else {
      const endAt = toUtcIso(b.endAt);
      if (!endAt) return validationError(ctx);
      target.endAt = endAt;
    }
  }
  if ('location' in b) {
    const location = str(b.location)?.trim() || null;
    if (location && location.length > 200) return validationError(ctx);
    target.location = location;
  }
  if ('description' in b) {
    const description = str(b.description)?.trim() || null;
    if (description && description.length > 500) return validationError(ctx);
    target.description = description;
  }
  if ('performanceId' in b) {
    const id = str(b.performanceId) || null;
    if (
      id &&
      !getStore().performances.some((p) => p.id === id && p.deletedAt === null)
    )
      return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
    target.performanceId = id;
  }
  if ('classId' in b) {
    const id = str(b.classId) || null;
    if (id && !getStore().classes.some((c) => c.id === id))
      return apiError(ctx, 404, 'CLS_001', '운영반 정보를 찾을 수 없습니다.');
    target.classId = id;
  }
  return null;
}

function endBeforeStart(s: Partial<ScheduleItemResponse>): boolean {
  return Boolean(
    s.startAt && s.endAt && Date.parse(s.endAt) < Date.parse(s.startAt)
  );
}

function endBeforeStartError(ctx: MockContext): Response {
  return apiError(
    ctx,
    400,
    'SCH_002',
    '종료 일시는 시작 일시 이후여야 합니다.'
  );
}

export const scheduleRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/schedules$/,
    auth: true,
    handle: (ctx) => {
      const type = ctx.query.get('type');
      const year = Number(ctx.query.get('year')) || null;
      const month = Number(ctx.query.get('month')) || null;
      const items = getStore()
        .schedules.filter((s) => {
          if (s.deletedAt !== null || (type && s.type !== type)) return false;
          const ym = kstYearMonth(s.startAt);
          return (!year || ym.year === year) && (!month || ym.month === month);
        })
        .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
        .map(toItem);
      return json(paginate(items, ctx.query));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/schedules$/,
    auth: true,
    handle: (ctx) => {
      const draft: Partial<ScheduleItemResponse> = {
        endAt: null,
        location: null,
        description: null,
        classId: null,
        performanceId: null,
      };
      const error = applySchedule(ctx, draft, true);
      if (error) return error;
      if (endBeforeStart(draft)) return endBeforeStartError(ctx);
      const created = {
        ...(draft as ScheduleItemResponse),
        id: newId(),
        deletedAt: null,
      };
      getStore().schedules.push(created);
      return json(toItem(created), 201);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/schedules\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = findSchedule(ctx.params.id);
      if (!s)
        return apiError(ctx, 404, 'SCH_001', '일정 정보를 찾을 수 없습니다.');
      const next: Partial<ScheduleItemResponse> = { ...s };
      const error = applySchedule(ctx, next, false);
      if (error) return error;
      if (endBeforeStart(next)) return endBeforeStartError(ctx);
      Object.assign(s, next);
      return json(toItem(s));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/schedules\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = findSchedule(ctx.params.id);
      if (!s)
        return apiError(ctx, 404, 'SCH_001', '일정 정보를 찾을 수 없습니다.');
      s.deletedAt = nowIso();
      return noContent();
    },
  },
];
