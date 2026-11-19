// ----------------------------------------------------------------------
// 목 공연·반(FN-09·10) — develop §3.4. 소프트 삭제, createdAt desc, 반 충돌 409 CLS_002 · 종료≤시작 400 CLS_003.
// ----------------------------------------------------------------------
import {
  apiError,
  byCreatedDesc,
  isAllowedImageUrl,
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
import { getStore } from '@/src/_mock/backend/mock-store';
import { todayKst } from '@/src/utils/kst-date-format';
import {
  DAY_CODES,
  PERFORMANCE_STATUSES,
  PERFORMANCE_TYPES,
  type ClassStatus,
  type DayCode,
  type PerformanceStatus,
  type PerformanceType,
} from '@/src/types/codes';
import type { ClassItemResponse } from '@/src/types/performance-class';
import type { AdminPerformanceResponse } from '@/src/types/performance';

function findPerformance(id: string) {
  return getStore().performances.find(
    (p) => p.id === id && p.deletedAt === null
  );
}

function toListItem(p: AdminPerformanceResponse) {
  const { id, title, type, status, isVisible, posterImageUrl, createdAt } = p;
  return { id, title, type, status, isVisible, posterImageUrl, createdAt };
}

function toDetail(
  p: AdminPerformanceResponse & { deletedAt: string | null }
): AdminPerformanceResponse {
  const { deletedAt: _deletedAt, ...rest } = p;
  return rest;
}

function applyPerformance(
  ctx: MockContext,
  target: Partial<AdminPerformanceResponse>,
  isCreate: boolean
): Response | null {
  const b = ctx.body;
  if (isCreate || 'title' in b) {
    const title = str(b.title)?.trim() ?? '';
    if (title.length < 1 || title.length > 100)
      return validationError(ctx, '작품명을 입력해주세요.');
    target.title = title;
  }
  if (isCreate || 'type' in b) {
    if (!PERFORMANCE_TYPES.includes(b.type as PerformanceType))
      return validationError(ctx);
    target.type = b.type as PerformanceType;
  }
  if (isCreate || 'status' in b) {
    if (!PERFORMANCE_STATUSES.includes(b.status as PerformanceStatus))
      return validationError(ctx);
    target.status = b.status as PerformanceStatus;
  }
  if ('description' in b) target.description = str(b.description);
  if ('posterImageUrl' in b) {
    if (b.posterImageUrl !== null && !isAllowedImageUrl(b.posterImageUrl)) {
      return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
    }
    target.posterImageUrl = str(b.posterImageUrl);
  }
  if ('detailImageUrls' in b) {
    const urls = Array.isArray(b.detailImageUrls) ? b.detailImageUrls : [];
    if (urls.length > 20 || !urls.every(isAllowedImageUrl)) {
      return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
    }
    target.detailImageUrls = urls as string[];
  }
  if ('isVisible' in b) target.isVisible = b.isVisible === true;
  return null;
}

const toMinutes = (t: string) =>
  Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function hasConflict(
  candidate: Omit<ClassItemResponse, 'id' | 'createdAt' | 'performanceId'>,
  selfId: string | null
): boolean {
  if (!candidate.startTime || !candidate.endTime) return false;
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  const today = todayKst();
  return getStore().classes.some(
    (c) =>
      c.id !== selfId &&
      c.status === 'ACTIVE' &&
      (c.deadline === null || c.deadline >= today) &&
      c.startTime !== null &&
      c.endTime !== null &&
      c.daysOfWeek.some((d) => candidate.daysOfWeek.includes(d)) &&
      toMinutes(c.startTime) < end &&
      start < toMinutes(c.endTime)
  );
}

function readClass(
  ctx: MockContext,
  base: ClassItemResponse | null
): ClassItemResponse | Response {
  const b = ctx.body;
  const next = { ...(base ?? ({} as ClassItemResponse)) };
  if (!base || 'name' in b) {
    const name = str(b.name)?.trim() ?? '';
    if (name.length < 1 || name.length > 100)
      return validationError(ctx, '반 이름을 입력해주세요.');
    next.name = name;
  }
  if (!base || 'daysOfWeek' in b) {
    const days = Array.isArray(b.daysOfWeek) ? (b.daysOfWeek as DayCode[]) : [];
    if (
      !days.every((d) => DAY_CODES.includes(d)) ||
      new Set(days).size !== days.length
    )
      return validationError(ctx);
    next.daysOfWeek = days;
  }
  for (const key of ['startTime', 'endTime', 'deadline', 'location'] as const) {
    if (!base || key in b) next[key] = str(b[key]);
  }
  if (!base || 'status' in b) {
    if (!['ACTIVE', 'INACTIVE'].includes(b.status as string))
      return validationError(ctx);
    next.status = b.status as ClassStatus;
  }
  if (
    next.startTime &&
    next.endTime &&
    toMinutes(next.endTime) <= toMinutes(next.startTime)
  ) {
    return apiError(
      ctx,
      400,
      'CLS_003',
      '종료 일시는 시작 일시 이후여야 합니다.'
    );
  }
  return next;
}

export const performanceRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances$/,
    auth: true,
    handle: (ctx) => {
      const status = ctx.query.get('status');
      const type = ctx.query.get('type');
      const items = getStore()
        .performances.filter((p) => p.deletedAt === null)
        .filter(
          (p) => (!status || p.status === status) && (!type || p.type === type)
        )
        .sort(byCreatedDesc)
        .map(toListItem);
      return json(paginate(items, ctx.query));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances$/,
    auth: true,
    handle: (ctx) => {
      const draft: Partial<AdminPerformanceResponse> = {
        description: null,
        posterImageUrl: null,
        detailImageUrls: [],
        isVisible: true,
      };
      const invalid = applyPerformance(ctx, draft, true);
      if (invalid) return invalid;
      const now = nowIso();
      const created = {
        ...(draft as AdminPerformanceResponse),
        id: newId(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      getStore().performances.push(created);
      return json(toDetail(created), 201);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const p = findPerformance(ctx.params.id);
      return p
        ? json(toDetail(p))
        : apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const p = findPerformance(ctx.params.id);
      if (!p)
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const patch: Partial<AdminPerformanceResponse> = {};
      const invalid = applyPerformance(ctx, patch, false);
      if (invalid) return invalid;
      Object.assign(p, patch, { updatedAt: nowIso() });
      return json(toDetail(p));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const p = findPerformance(ctx.params.id);
      if (!p)
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      p.deletedAt = nowIso();
      return noContent();
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/classes$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformance(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const items = getStore()
        .classes.filter((c) => c.performanceId === ctx.params.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/classes$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformance(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const read = readClass(ctx, null);
      if (read instanceof Response) return read;
      if (read.status === 'ACTIVE' && hasConflict(read, null)) {
        return apiError(
          ctx,
          409,
          'CLS_002',
          '선택한 요일/시간에 이미 다른 반이 있습니다'
        );
      }
      const created: ClassItemResponse = {
        ...read,
        id: newId(),
        performanceId: ctx.params.id,
        createdAt: nowIso(),
      };
      getStore().classes.push(created);
      return json(created, 201);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/classes$/,
    auth: true,
    handle: (ctx) => {
      const status = ctx.query.get('status');
      const alive = new Set(
        getStore()
          .performances.filter((p) => p.deletedAt === null)
          .map((p) => p.id)
      );
      return json({
        items: getStore().classes.filter(
          (c) => alive.has(c.performanceId) && (!status || c.status === status)
        ),
      });
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/classes\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const index = store.classes.findIndex((c) => c.id === ctx.params.id);
      if (index < 0)
        return apiError(ctx, 404, 'CLS_001', '운영반 정보를 찾을 수 없습니다.');
      const read = readClass(ctx, store.classes[index]);
      if (read instanceof Response) return read;
      if (read.status === 'ACTIVE' && hasConflict(read, read.id)) {
        return apiError(
          ctx,
          409,
          'CLS_002',
          '선택한 요일/시간에 이미 다른 반이 있습니다'
        );
      }
      store.classes[index] = read;
      return json(read);
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/classes\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const before = store.classes.length;
      store.classes = store.classes.filter((c) => c.id !== ctx.params.id);
      return before === store.classes.length
        ? apiError(ctx, 404, 'CLS_001', '운영반 정보를 찾을 수 없습니다.')
        : noContent();
    },
  },
];
