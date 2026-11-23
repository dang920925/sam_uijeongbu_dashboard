// ----------------------------------------------------------------------
// (U48) 목 캐스트 사진 · 홈페이지 미리보기(back-end §25.2~25.5 · §25.9). 상태는 이 파일 전역에 두고 공용 저장소가
// 초기화되면(`__mock/reset`) 함께 비운다(team-accounts 와 같은 방식 — mock-store 를 고치지 않게).
// - 단체샷 공연당 4장(PHO_002), 순서 목록 불일치 PHO_003, 없는 단체샷 PHO_001. 팀샷은 폐기 안 된 팀만(TEAM_005).
// - 배역 사진은 그 배역의 기본 캐스트·회차 지정 배우만(PHO_004). 목 배우 프로필 id = `ap-{단원 id}`.
// - 이미지 URL 은 목 Storage 공개 URL 또는 https(아니면 400 UPL_003). 오류 문구는 서버 계약 문구 그대로.
// - 미리보기 토큰은 목 문자열(30분 만료 시각만 계약대로).
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
import type { GroupPhotoItemResponse } from '@/src/types/cast-photo';

const GROUP_MAX = 4;
const PERF_NOT_FOUND = '작품 정보를 찾을 수 없습니다.';

interface PhotoMockState {
  owner: object;
  /** 공연 id → 단체샷(순서대로) */
  groups: Map<string, { id: string; imageUrl: string }[]>;
  /** 팀 id → 팀샷 */
  teams: Map<string, string>;
  /** `${roleId}:${actorProfileId}` → 이미지 */
  roles: Map<string, string>;
}

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
    };
  }
  return globalForPhoto.__samCastPhotoMock;
}

function groupsOf(performanceId: string) {
  const s = state();
  if (!s.groups.has(performanceId)) s.groups.set(performanceId, []);
  return s.groups.get(performanceId) as { id: string; imageUrl: string }[];
}

function groupList(performanceId: string) {
  const items: GroupPhotoItemResponse[] = groupsOf(performanceId).map(
    (g, index) => ({ id: g.id, imageUrl: g.imageUrl, sortOrder: index })
  );
  return { items, maxCount: GROUP_MAX };
}

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
        .map(([key, imageUrl]) => {
          const [roleId, actorProfileId] = key.split(':');
          return {
            roleId,
            actorProfileId,
            memberId: actorProfileId.replace(/^ap-/, ''),
            imageUrl,
          };
        })
        .filter((p) => roleIds.has(p.roleId));
      return json({
        castPublic: performance.castPublic ?? false,
        groupPhotos: groupList(performance.id).items,
        groupPhotoMax: GROUP_MAX,
        teams: mockActiveTeams(performance.id).map((t) => ({
          teamAccountId: t.id,
          label: t.label,
          photoUrl: s.teams.get(t.id) ?? null,
        })),
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
      const list = groupsOf(ctx.params.id);
      if (list.length >= GROUP_MAX)
        return apiError(
          ctx,
          400,
          'PHO_002',
          '단체 사진은 4장까지 올릴 수 있습니다.'
        );
      list.push({ id: newId(), imageUrl: url });
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
        (id) =>
          list.find((g) => g.id === id) as { id: string; imageUrl: string }
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
      target.imageUrl = url;
      return json(groupList(ctx.params.id));
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
      state().teams.set(team.id, url);
      return json({ teamAccountId: team.id, label: team.label, photoUrl: url });
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/photo$/,
    auth: true,
    handle: (ctx) => {
      if (!findTeam(ctx.params.id)) return teamNotFound(ctx);
      state().teams.delete(ctx.params.id);
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
      state().roles.set(`${ctx.params.id}:${ctx.params.apId}`, url);
      return json({
        roleId: ctx.params.id,
        actorProfileId: ctx.params.apId,
        memberId,
        imageUrl: url,
      });
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
