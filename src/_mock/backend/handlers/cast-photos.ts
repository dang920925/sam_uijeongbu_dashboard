// ----------------------------------------------------------------------
// (U48) 목 캐스트 사진 · 홈페이지 미리보기(back-end §25.2~25.5 · §25.9). 상태는 이 파일 전역에 두고 공용 저장소가
// 초기화되면(`__mock/reset`) 함께 비운다(team-accounts 와 같은 방식 — mock-store 를 고치지 않게).
// - 단체샷 공연당 4장(PHO_002), 순서 목록 불일치 PHO_003, 없는 단체샷 PHO_001. 팀샷은 폐기 안 된 팀만(TEAM_005).
// - 배역 사진은 그 배역의 기본 캐스트·회차 지정 배우만(PHO_004). 목 배우 프로필 id = `ap-{단원 id}`.
// - 이미지 URL 은 목 Storage 공개 URL 또는 https(아니면 400 UPL_003). 오류 문구는 서버 계약 문구 그대로.
// - 미리보기 토큰은 목 문자열(30분 만료 시각만 계약대로).
// - (U51 §27) 사진마다 크기(width·height — 둘 다 또는 생략)·위치(crop)·비율을 둔다. 교체(URL 이 바뀜)하면 위치·크기 초기화,
//   비율은 유지. `…/display` PATCH 는 보낸 필드만, 빈 본문 400. 배역 카드 비율은 공연마다(기본 3:4).
// ----------------------------------------------------------------------
import { randomUUID } from 'node:crypto';

import { findPerformanceAlive } from '@/src/_mock/backend/booking-model';
import { mockActiveTeams } from '@/src/_mock/backend/handlers/team-accounts';
import {
  apiError,
  isAllowedImageUrl,
  json,
  newId,
  noContent,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';
import type {
  CastCardRatioCode,
  CropResponse,
  DisplayRatioCode,
  GroupPhotoItemResponse,
} from '@/src/types/cast-photo';

const GROUP_MAX = 4;
const PERF_NOT_FOUND = '작품 정보를 찾을 수 없습니다.';

interface PhotoRecord {
  imageUrl: string;
  width: number | null;
  height: number | null;
  crop: CropResponse | null;
}

interface GroupRecord extends PhotoRecord {
  id: string;
  displayRatio: DisplayRatioCode | null;
}

interface RoleRecord extends PhotoRecord {
  thumbCrop: CropResponse | null;
}

interface TeamRecord {
  photo: PhotoRecord | null;
  photoRatio: DisplayRatioCode | null;
}

interface PhotoMockState {
  owner: object;
  /** 공연 id → 단체샷(순서대로) */
  groups: Map<string, GroupRecord[]>;
  /** 팀 id → 팀샷 */
  teams: Map<string, TeamRecord>;
  /** `${roleId}:${actorProfileId}` → 이미지 */
  roles: Map<string, RoleRecord>;
  /** 공연 id → 배역 카드 비율 */
  cardRatios: Map<string, CastCardRatioCode>;
}

const CARD_RATIOS: readonly string[] = ['3:4', '2:3', '4:5', '1:1'];
const DISPLAY_RATIOS: readonly string[] = ['16:9', '4:3', '1:1', '3:4'];
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

const globalForPhoto = globalThis as unknown as {
  __samCastPhotoMock?: PhotoMockState;
};

function state(): PhotoMockState {
  const owner = getStore();
  if (globalForPhoto.__samCastPhotoMock?.owner !== owner) {
    globalForPhoto.__samCastPhotoMock = {
      owner,
      groups: new Map(),
      teams: new Map(),
      roles: new Map(),
      cardRatios: new Map(),
    };
  }
  return globalForPhoto.__samCastPhotoMock;
}

function groupsOf(performanceId: string) {
  const s = state();
  if (!s.groups.has(performanceId)) s.groups.set(performanceId, []);
  return s.groups.get(performanceId) as GroupRecord[];
}

function groupList(performanceId: string) {
  const items: GroupPhotoItemResponse[] = groupsOf(performanceId).map(
    (g, index) => ({
      id: g.id,
      imageUrl: g.imageUrl,
      sortOrder: index,
      width: g.width,
      height: g.height,
      displayRatio: g.displayRatio,
      crop: g.crop,
    })
  );
  return { items, maxCount: GROUP_MAX };
}

function teamOf(teamId: string): TeamRecord {
  return state().teams.get(teamId) ?? { photo: null, photoRatio: null };
}

function teamItem(team: { id: string; label: string }) {
  const record = teamOf(team.id);
  return {
    teamAccountId: team.id,
    label: team.label,
    photoUrl: record.photo?.imageUrl ?? null,
    photoWidth: record.photo?.width ?? null,
    photoHeight: record.photo?.height ?? null,
    photoRatio: record.photoRatio,
    photoCrop: record.photo?.crop ?? null,
  };
}

function roleItem(key: string, record: RoleRecord) {
  const [roleId, actorProfileId] = key.split(':');
  return {
    roleId,
    actorProfileId,
    memberId: actorProfileId.replace(/^ap-/, ''),
    imageUrl: record.imageUrl,
    width: record.width,
    height: record.height,
    crop: record.crop,
    thumbCrop: record.thumbCrop,
  };
}

const badValue = (ctx: MockContext, message: string) =>
  apiError(ctx, 400, 'COMMON_001', message);

/** 크기 — 둘 다 1~20000 정수이거나 둘 다 생략(§27.3) */
function readSize(
  ctx: MockContext
): { width: number | null; height: number | null } | Response {
  const { width, height } = ctx.body;
  if (width === undefined && height === undefined)
    return { width: null, height: null };
  if (width === undefined || height === undefined)
    return badValue(ctx, '사진 크기는 가로·세로를 함께 보내주세요.');
  const ok = (v: unknown) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 20000;
  if (!ok(width) || !ok(height))
    return badValue(ctx, '사진 크기 값이 올바르지 않습니다.');
  return { width: width as number, height: height as number };
}

/** Crop | null — 키 셋 다 필수, 범위 0~100·1~3, 반올림(§27.1) */
function readCrop(value: unknown): CropResponse | null | 'invalid' {
  if (value === null) return null;
  if (typeof value !== 'object') return 'invalid';
  const v = value as Record<string, unknown>;
  const keys = Object.keys(v).sort().join(',');
  if (keys !== 'x,y,zoom') return 'invalid';
  const { x, y, zoom } = v;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof zoom !== 'number' ||
    x < 0 ||
    x > 100 ||
    y < 0 ||
    y > 100 ||
    zoom < 1 ||
    zoom > 3
  )
    return 'invalid';
  return { x: r1(x), y: r1(y), zoom: r2(zoom) };
}

function readRatio(value: unknown): DisplayRatioCode | null | 'invalid' {
  if (value === null) return null;
  return DISPLAY_RATIOS.includes(value as string)
    ? (value as DisplayRatioCode)
    : 'invalid';
}

const CROP_INVALID = '사진 위치 값이 올바르지 않습니다.';
const EMPTY_PATCH = '바꿀 값을 하나 이상 보내주세요.';

function readImage(ctx: MockContext): string | Response {
  const url = ctx.body.imageUrl;
  if (typeof url !== 'string' || url.length === 0 || url.length > 500)
    return apiError(ctx, 400, 'COMMON_001', '입력값을 확인해주세요.');
  if (!isAllowedImageUrl(url))
    return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
  return url;
}

function findTeam(teamId: string) {
  return getStore()
    .performances.filter((p) => p.deletedAt === null)
    .flatMap((p) =>
      mockActiveTeams(p.id).map((t) => ({ ...t, performanceId: p.id }))
    )
    .find((t) => t.id === teamId);
}

const teamNotFound = (ctx: MockContext) =>
  apiError(ctx, 404, 'TEAM_005', '팀 계정을 찾을 수 없습니다.');

const performanceGuard = (ctx: MockContext) =>
  findPerformanceAlive(ctx.params.id)
    ? null
    : apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND);

export const castPhotoRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/cast-photos$/,
    auth: true,
    handle: (ctx) => {
      const performance = findPerformanceAlive(ctx.params.id);
      if (!performance) return apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND);
      const store = getStore();
      const s = state();
      const roleIds = new Set(
        store.roles
          .filter((r) => r.performanceId === performance.id)
          .map((r) => r.id)
      );
      const rolePhotos = [...s.roles.entries()]
        .map(([key, record]) => roleItem(key, record))
        .filter((p) => roleIds.has(p.roleId));
      return json({
        castPublic: performance.castPublic ?? false,
        castCardRatio: s.cardRatios.get(performance.id) ?? '3:4',
        groupPhotos: groupList(performance.id).items,
        groupPhotoMax: GROUP_MAX,
        teams: mockActiveTeams(performance.id).map(teamItem),
        rolePhotos,
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/group-photos$/,
    auth: true,
    handle: (ctx) => {
      const guard = performanceGuard(ctx);
      if (guard) return guard;
      const url = readImage(ctx);
      if (url instanceof Response) return url;
      const size = readSize(ctx);
      if (size instanceof Response) return size;
      const ratio =
        ctx.body.displayRatio === undefined
          ? null
          : readRatio(ctx.body.displayRatio);
      if (ratio === 'invalid') return badValue(ctx, CROP_INVALID);
      const list = groupsOf(ctx.params.id);
      if (list.length >= GROUP_MAX)
        return apiError(
          ctx,
          400,
          'PHO_002',
          '단체 사진은 4장까지 올릴 수 있습니다.'
        );
      list.push({
        id: newId(),
        imageUrl: url,
        ...size,
        crop: null,
        displayRatio: ratio,
      });
      return json(groupList(ctx.params.id), 201);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/group-photos\/order$/,
    auth: true,
    handle: (ctx) => {
      const guard = performanceGuard(ctx);
      if (guard) return guard;
      const list = groupsOf(ctx.params.id);
      const ids = ctx.body.photoIds;
      const valid =
        Array.isArray(ids) &&
        ids.length === list.length &&
        new Set(ids).size === ids.length &&
        ids.every((id) => list.some((g) => g.id === id));
      if (!valid)
        return apiError(
          ctx,
          400,
          'PHO_003',
          '단체 사진 순서 목록이 맞지 않습니다.'
        );
      const next = (ids as string[]).map(
        (id) => list.find((g) => g.id === id) as GroupRecord
      );
      state().groups.set(ctx.params.id, next);
      return json(groupList(ctx.params.id));
    },
  },
  {
    method: 'PATCH',
    pattern:
      /^\/v1\/admin\/performances\/(?<id>[^/]+)\/group-photos\/(?<photoId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = groupsOf(ctx.params.id).find(
        (g) => g.id === ctx.params.photoId
      );
      if (!target)
        return apiError(ctx, 404, 'PHO_001', '단체 사진을 찾을 수 없습니다.');
      const url = readImage(ctx);
      if (url instanceof Response) return url;
      const size = readSize(ctx);
      if (size instanceof Response) return size;
      if (target.imageUrl !== url) target.crop = null;
      Object.assign(target, { imageUrl: url, ...size });
      return json(groupList(ctx.params.id));
    },
  },
  {
    method: 'PATCH',
    pattern:
      /^\/v1\/admin\/performances\/(?<id>[^/]+)\/group-photos\/(?<photoId>[^/]+)\/display$/,
    auth: true,
    handle: (ctx) => {
      const target = groupsOf(ctx.params.id).find(
        (g) => g.id === ctx.params.photoId
      );
      if (!target)
        return apiError(ctx, 404, 'PHO_001', '단체 사진을 찾을 수 없습니다.');
      const hasRatio = 'displayRatio' in ctx.body;
      const hasCrop = 'crop' in ctx.body;
      if (!hasRatio && !hasCrop) return badValue(ctx, EMPTY_PATCH);
      const ratio = hasRatio ? readRatio(ctx.body.displayRatio) : null;
      const crop = hasCrop ? readCrop(ctx.body.crop) : null;
      if (ratio === 'invalid' || crop === 'invalid')
        return badValue(ctx, CROP_INVALID);
      if (hasRatio) target.displayRatio = ratio;
      if (hasCrop) target.crop = crop;
      return json(groupList(ctx.params.id));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/cast-card-ratio$/,
    auth: true,
    handle: (ctx) => {
      const guard = performanceGuard(ctx);
      if (guard) return guard;
      const ratio = ctx.body.castCardRatio;
      if (!CARD_RATIOS.includes(ratio as string))
        return badValue(ctx, '입력값을 확인해주세요.');
      state().cardRatios.set(ctx.params.id, ratio as CastCardRatioCode);
      return json({ castCardRatio: ratio });
    },
  },
  {
    method: 'DELETE',
    pattern:
      /^\/v1\/admin\/performances\/(?<id>[^/]+)\/group-photos\/(?<photoId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const list = groupsOf(ctx.params.id);
      if (!list.some((g) => g.id === ctx.params.photoId))
        return apiError(ctx, 404, 'PHO_001', '단체 사진을 찾을 수 없습니다.');
      state().groups.set(
        ctx.params.id,
        list.filter((g) => g.id !== ctx.params.photoId)
      );
      return noContent();
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/photo$/,
    auth: true,
    handle: (ctx) => {
      const team = findTeam(ctx.params.id);
      if (!team) return teamNotFound(ctx);
      const url = readImage(ctx);
      if (url instanceof Response) return url;
      const size = readSize(ctx);
      if (size instanceof Response) return size;
      const record = teamOf(team.id);
      const crop = record.photo?.imageUrl === url ? record.photo.crop : null;
      state().teams.set(team.id, {
        ...record,
        photo: { imageUrl: url, ...size, crop },
      });
      return json(teamItem(team));
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/photo\/display$/,
    auth: true,
    handle: (ctx) => {
      const team = findTeam(ctx.params.id);
      if (!team) return teamNotFound(ctx);
      const hasRatio = 'photoRatio' in ctx.body;
      const hasCrop = 'photoCrop' in ctx.body;
      if (!hasRatio && !hasCrop) return badValue(ctx, EMPTY_PATCH);
      const ratio = hasRatio ? readRatio(ctx.body.photoRatio) : null;
      const crop = hasCrop ? readCrop(ctx.body.photoCrop) : null;
      if (ratio === 'invalid' || crop === 'invalid')
        return badValue(ctx, CROP_INVALID);
      const record = teamOf(team.id);
      if (hasCrop && crop !== null && !record.photo)
        return apiError(
          ctx,
          400,
          'PHO_006',
          '팀샷이 없어 보이는 위치를 정할 수 없습니다.'
        );
      state().teams.set(team.id, {
        photoRatio: hasRatio ? ratio : record.photoRatio,
        photo:
          record.photo && hasCrop ? { ...record.photo, crop } : record.photo,
      });
      return json(teamItem(team));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/photo$/,
    auth: true,
    handle: (ctx) => {
      if (!findTeam(ctx.params.id)) return teamNotFound(ctx);
      const record = teamOf(ctx.params.id);
      state().teams.set(ctx.params.id, { ...record, photo: null });
      return noContent();
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/roles\/(?<id>[^/]+)\/photos\/(?<apId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      if (!store.roles.some((r) => r.id === ctx.params.id))
        return apiError(ctx, 404, 'ROL_001', '배역을 찾을 수 없습니다.');
      const memberId = ctx.params.apId.replace(/^ap-/, '');
      if (
        !store.roleCasts.some(
          (c) => c.roleId === ctx.params.id && c.memberId === memberId
        )
      )
        return apiError(
          ctx,
          400,
          'PHO_004',
          '이 배역에 캐스팅된 배우만 배역 사진을 올릴 수 있습니다.'
        );
      const url = readImage(ctx);
      if (url instanceof Response) return url;
      const size = readSize(ctx);
      if (size instanceof Response) return size;
      const key = `${ctx.params.id}:${ctx.params.apId}`;
      const before = state().roles.get(key);
      const same = before?.imageUrl === url;
      const record: RoleRecord = {
        imageUrl: url,
        ...size,
        crop: same ? before.crop : null,
        thumbCrop: same ? before.thumbCrop : null,
      };
      state().roles.set(key, record);
      return json(roleItem(key, record));
    },
  },
  {
    method: 'PATCH',
    pattern:
      /^\/v1\/admin\/roles\/(?<id>[^/]+)\/photos\/(?<apId>[^/]+)\/display$/,
    auth: true,
    handle: (ctx) => {
      if (!getStore().roles.some((r) => r.id === ctx.params.id))
        return apiError(ctx, 404, 'ROL_001', '배역을 찾을 수 없습니다.');
      const key = `${ctx.params.id}:${ctx.params.apId}`;
      const record = state().roles.get(key);
      if (!record)
        return apiError(ctx, 404, 'PHO_005', '배역 사진을 찾을 수 없습니다.');
      const hasCrop = 'crop' in ctx.body;
      const hasThumb = 'thumbCrop' in ctx.body;
      if (!hasCrop && !hasThumb) return badValue(ctx, EMPTY_PATCH);
      const crop = hasCrop ? readCrop(ctx.body.crop) : null;
      const thumbCrop = hasThumb ? readCrop(ctx.body.thumbCrop) : null;
      if (crop === 'invalid' || thumbCrop === 'invalid')
        return badValue(ctx, CROP_INVALID);
      if (hasCrop) record.crop = crop;
      if (hasThumb) record.thumbCrop = thumbCrop;
      return json(roleItem(key, record));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/roles\/(?<id>[^/]+)\/photos\/(?<apId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      if (!getStore().roles.some((r) => r.id === ctx.params.id))
        return apiError(ctx, 404, 'ROL_001', '배역을 찾을 수 없습니다.');
      state().roles.delete(`${ctx.params.id}:${ctx.params.apId}`);
      return noContent();
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/preview-token$/,
    auth: true,
    handle: (ctx) => {
      const guard = performanceGuard(ctx);
      if (guard) return guard;
      return json(
        {
          token: `mock-preview.${randomUUID()}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        201
      );
    },
  },
];
