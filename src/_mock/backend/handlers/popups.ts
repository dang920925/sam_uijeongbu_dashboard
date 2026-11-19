// ----------------------------------------------------------------------
// 목 팝업(FN-17) — develop §3.4. 목록 `{ items }` createdAt desc + overlapsActive(활성이고 기간이 다른 활성 팝업과
// 겹치면 true — 막지 않고 경고 근거만). 이미지 URL 허용 저장소만(400 UPL_003), 링크 https 만 ≤500(400 COMMON_001),
// 종료일 < 시작일 400 POP_002, 없는 id 404 POP_001, 소프트 삭제.
// ----------------------------------------------------------------------
import {
  apiError,
  isAllowedImageUrl,
  isHttpsUrl,
  json,
  newId,
  noContent,
  nowIso,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  getStore,
  type MockPopup,
  type SoftDeleted,
} from '@/src/_mock/backend/mock-store';
import type { AdminPopupItemResponse } from '@/src/types/content';

type StoredPopup = SoftDeleted<MockPopup>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function livePopups(): StoredPopup[] {
  return getStore().popups.filter((p) => p.deletedAt === null);
}

function overlapsActive(p: MockPopup, all: MockPopup[]): boolean {
  if (!p.isActive) return false;
  return all.some(
    (o) =>
      o.id !== p.id &&
      o.isActive &&
      p.startDate <= o.endDate &&
      o.startDate <= p.endDate
  );
}

function toItem(p: StoredPopup, all: MockPopup[]): AdminPopupItemResponse {
  const { deletedAt: _deletedAt, ...rest } = p;
  return { ...rest, overlapsActive: overlapsActive(rest, all) };
}

function findPopup(id: string): StoredPopup | undefined {
  return livePopups().find((p) => p.id === id);
}

/** base(수정 대상 또는 생성 기본값)에 본문을 합쳐 검증한다 */
function readPopup(ctx: MockContext, base: MockPopup): MockPopup | Response {
  const b = ctx.body;
  const next: MockPopup = { ...base };
  if ('imageUrl' in b || !base.imageUrl) {
    if (!isAllowedImageUrl(b.imageUrl))
      return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
    next.imageUrl = b.imageUrl as string;
  }
  if ('linkUrl' in b) {
    if (b.linkUrl !== null) {
      if (!isHttpsUrl(b.linkUrl) || (b.linkUrl as string).length > 500)
        return validationError(ctx);
    }
    next.linkUrl = b.linkUrl as string | null;
  }
  for (const key of ['startDate', 'endDate'] as const) {
    if (!(key in b) && base[key]) continue;
    if (typeof b[key] !== 'string' || !DATE.test(b[key] as string))
      return validationError(ctx);
    next[key] = b[key] as string;
  }
  if ('isActive' in b) {
    if (typeof b.isActive !== 'boolean') return validationError(ctx);
    next.isActive = b.isActive;
  }
  if (next.endDate < next.startDate)
    return apiError(ctx, 400, 'POP_002', '종료일은 시작일 이후여야 합니다.');
  return next;
}

export const popupRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/popups$/,
    auth: true,
    handle: () => {
      const all = livePopups();
      const items = all
        .map((p) => toItem(p, all))
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
        );
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/popups$/,
    auth: true,
    handle: (ctx) => {
      const now = nowIso();
      const base: MockPopup = {
        id: newId(),
        imageUrl: '',
        linkUrl: null,
        startDate: '',
        endDate: '',
        isActive: true,
        createdAt: now,
      };
      const next = readPopup(ctx, base);
      if (next instanceof Response) return next;
      const created: StoredPopup = { ...next, deletedAt: null };
      getStore().popups.push(created);
      return json(toItem(created, livePopups()), 201);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/popups\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = findPopup(ctx.params.id);
      if (!target)
        return apiError(ctx, 404, 'POP_001', '팝업 정보를 찾을 수 없습니다.');
      const { deletedAt: _deletedAt, ...current } = target;
      const next = readPopup(ctx, current);
      if (next instanceof Response) return next;
      Object.assign(target, next);
      return json(toItem(target, livePopups()));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/popups\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = findPopup(ctx.params.id);
      if (!target)
        return apiError(ctx, 404, 'POP_001', '팝업 정보를 찾을 수 없습니다.');
      target.deletedAt = nowIso();
      return noContent();
    },
  },
];
