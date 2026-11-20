// ----------------------------------------------------------------------
// 목 연출진(FN-16) — develop §3.4. 목록 `{ items }` displayOrder asc(비노출 포함), name·role 1~50 · bio ≤1000 검증
// (400 COMMON_001 기본 문구), 사진 URL 은 허용 저장소만(400 UPL_003), 없는 id 404 STF_001, 소프트 삭제.
// ----------------------------------------------------------------------
import {
  apiError,
  isAllowedImageUrl,
  json,
  newId,
  noContent,
  nowIso,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type SoftDeleted } from '@/src/_mock/backend/mock-store';
import type { AdminStaffItemResponse } from '@/src/types/content';

type MockStaff = SoftDeleted<AdminStaffItemResponse>;

function toItem(s: MockStaff): AdminStaffItemResponse {
  const { deletedAt: _deletedAt, ...rest } = s;
  return { ...rest, histories: getStore().staffHistories.get(s.id) ?? [] };
}

/** 연혁(U28) — 보내면 통째 교체(0~50, 연도 1900~2100 · 내용 1~200). 잘못되면 400 */
function readHistories(
  ctx: MockContext
): { year: number; content: string }[] | null | Response {
  if (!('histories' in ctx.body)) return null;
  const list = ctx.body.histories;
  if (!Array.isArray(list) || list.length > 50) return validationError(ctx);
  const rows = (list as Record<string, unknown>[]).map((h) => ({
    year: Number(h.year),
    content: str(h.content)?.trim() ?? '',
  }));
  const valid = rows.every(
    (h) =>
      Number.isInteger(h.year) &&
      h.year >= 1900 &&
      h.year <= 2100 &&
      h.content.length >= 1 &&
      h.content.length <= 200
  );
  return valid ? rows : validationError(ctx);
}

function findStaff(id: string): MockStaff | undefined {
  return getStore().staff.find((s) => s.id === id && s.deletedAt === null);
}

/** 본문을 target 에 반영한다. 생성이면 name·role 필수. 검증 실패면 오류 응답 */
function applyStaff(
  ctx: MockContext,
  target: Partial<AdminStaffItemResponse>,
  isCreate: boolean
): Response | null {
  const b = ctx.body;
  for (const key of ['name', 'role'] as const) {
    if (!isCreate && !(key in b)) continue;
    const value = str(b[key])?.trim() ?? '';
    if (value.length < 1 || value.length > 50) return validationError(ctx);
    target[key] = value;
  }
  if ('profileImageUrl' in b) {
    if (b.profileImageUrl !== null && !isAllowedImageUrl(b.profileImageUrl))
      return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
    target.profileImageUrl = str(b.profileImageUrl);
  }
  if ('bio' in b) {
    const bio = str(b.bio);
    if (bio !== null && bio.length > 1000) return validationError(ctx);
    target.bio = bio;
  }
  if ('displayOrder' in b) {
    const order = b.displayOrder;
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 0)
      return validationError(ctx);
    target.displayOrder = order;
  }
  if ('isVisible' in b) {
    if (typeof b.isVisible !== 'boolean') return validationError(ctx);
    target.isVisible = b.isVisible;
  }
  return null;
}

export const staffRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/staff$/,
    auth: true,
    handle: () => {
      const items = getStore()
        .staff.filter((s) => s.deletedAt === null)
        .map(toItem)
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder ||
            a.createdAt.localeCompare(b.createdAt) ||
            a.id.localeCompare(b.id)
        );
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/staff$/,
    auth: true,
    handle: (ctx) => {
      const draft: Partial<AdminStaffItemResponse> = {
        profileImageUrl: null,
        bio: null,
        displayOrder: 0,
        isVisible: true,
      };
      const invalid = applyStaff(ctx, draft, true);
      if (invalid) return invalid;
      const histories = readHistories(ctx);
      if (histories instanceof Response) return histories;
      const created: MockStaff = {
        ...(draft as AdminStaffItemResponse),
        id: newId(),
        createdAt: nowIso(),
        deletedAt: null,
      };
      getStore().staff.push(created);
      if (histories) getStore().staffHistories.set(created.id, histories);
      return json(toItem(created), 201);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/staff\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = findStaff(ctx.params.id);
      if (!target)
        return apiError(ctx, 404, 'STF_001', '연출진 정보를 찾을 수 없습니다.');
      const next: Partial<AdminStaffItemResponse> = {};
      const invalid = applyStaff(ctx, next, false);
      if (invalid) return invalid;
      const histories = readHistories(ctx);
      if (histories instanceof Response) return histories;
      Object.assign(target, next);
      if (histories) getStore().staffHistories.set(target.id, histories);
      return json(toItem(target));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/staff\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = findStaff(ctx.params.id);
      if (!target)
        return apiError(ctx, 404, 'STF_001', '연출진 정보를 찾을 수 없습니다.');
      target.deletedAt = nowIso();
      return noContent();
    },
  },
];
