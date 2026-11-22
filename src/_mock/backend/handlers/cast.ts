// ----------------------------------------------------------------------
// 목 배역·캐스팅·참여자(R3 — develop §11.7 · §17.3 · §17.5). 서버와 같은 규칙만 흉내 낸다:
// - "출연" 묶음(name null)은 공연당 1개(409 ROL_004), roleId 없는 배우 추가는 묶음을 만들거나 재사용.
// - 같은 배역에 같은 배우 409 ROL_005, 다른 공연의 회차·배역 400 ROL_003, 순서 목록 불일치 ROL_002·CRD_003.
// - 참여자 연결은 하나만(CRD_002), 연결하면 이름 스냅숏. 공개 판단(publicNow)은 서버 규칙(§17.2) 그대로.
// - 배우 프로필 id 는 `ap-{단원 id}`(members 목과 같음), 배우 추가 때 프로필이 없으면 만든다(J-91).
// ----------------------------------------------------------------------
import { emptyProfile, findMember } from '@/src/_mock/backend/handlers/members';
import {
  apiError,
  json,
  newId,
  noContent,
  nowIso,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  getStore,
  type MockCredit,
  type MockRole,
  type MockRoleCast,
} from '@/src/_mock/backend/mock-store';
import type {
  AdminCreditResponse,
  AdminRoleCastResponse,
  AdminRoleResponse,
  ShowCastCellResponse,
} from '@/src/types/cast';

const PROFILE_PREFIX = 'ap-';
const toProfileId = (memberId: string) => `${PROFILE_PREFIX}${memberId}`;
const toMemberId = (profileId: string) =>
  profileId.startsWith(PROFILE_PREFIX)
    ? profileId.slice(PROFILE_PREFIX.length)
    : '';

function findPerformance(id: string) {
  return getStore().performances.find(
    (p) => p.id === id && p.deletedAt === null
  );
}

function isCastPublic(performanceId: string): boolean {
  const p = findPerformance(performanceId);
  return Boolean(p && p.isVisible && p.castPublic === true);
}

function isPublicActor(memberId: string): boolean {
  const m = findMember(memberId);
  return Boolean(
    m &&
    m.type === 'ACTOR' &&
    m.isVisible &&
    getStore().actorProfiles.has(memberId)
  );
}

function castItem(row: MockRoleCast): AdminRoleCastResponse {
  const m = getStore().members.find((x) => x.id === row.memberId);
  return {
    actorProfileId: toProfileId(row.memberId),
    memberId: row.memberId,
    name: m?.name ?? '',
    isVisible: isPublicActor(row.memberId),
    note: row.note,
  };
}

function rowsOf(roleId: string, showId: string | null): MockRoleCast[] {
  return getStore()
    .roleCasts.filter((r) => r.roleId === roleId && r.showId === showId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function passes(name: string | null, rows: MockRoleCast[]): boolean {
  const flags = rows.map((r) => isPublicActor(r.memberId));
  return name === null ? flags.some(Boolean) : flags.every(Boolean);
}

function toRole(role: MockRole): AdminRoleResponse {
  const rows = rowsOf(role.id, null);
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    sortOrder: role.sortOrder,
    isRecruiting: role.isRecruiting,
    publicNow: isCastPublic(role.performanceId) && passes(role.name, rows),
    defaultCast: rows.map(castItem),
  };
}

function rolesOf(performanceId: string): MockRole[] {
  return getStore()
    .roles.filter((r) => r.performanceId === performanceId)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
    );
}

function toCell(role: MockRole, showId: string): ShowCastCellResponse {
  const override = rowsOf(role.id, showId);
  const rows = override.length > 0 ? override : rowsOf(role.id, null);
  return {
    showId,
    roleId: role.id,
    isOverride: override.length > 0,
    publicNow: isCastPublic(role.performanceId) && passes(role.name, rows),
    actors: rows.map(castItem),
  };
}

function toCredit(c: MockCredit): AdminCreditResponse {
  const store = getStore();
  const staff = c.staffId
    ? (store.staff.find((s) => s.id === c.staffId) ?? null)
    : null;
  const member = c.memberId ? (findMember(c.memberId) ?? null) : null;
  const staffPublic = staff
    ? staff.isVisible && staff.deletedAt === null
    : false;
  const memberPublic = member ? isPublicActor(member.id) : false;
  const linkPublic = staff ? staffPublic : member ? memberPublic : true;
  return {
    id: c.id,
    title: c.title,
    staff: staff
      ? { id: staff.id, name: staff.name, isVisible: staffPublic }
      : null,
    member: member
      ? { id: member.id, name: member.name, isVisible: memberPublic }
      : null,
    displayName: c.displayName,
    sortOrder: c.sortOrder,
    isVisible: c.isVisible,
    publicNow: isCastPublic(c.performanceId) && c.isVisible && linkPublic,
  };
}

function creditsOf(performanceId: string): MockCredit[] {
  return getStore()
    .credits.filter((c) => c.performanceId === performanceId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

const notFound = {
  perf: (ctx: MockContext) =>
    apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.'),
  role: (ctx: MockContext) =>
    apiError(ctx, 404, 'ROL_001', '배역을 찾을 수 없습니다.'),
  credit: (ctx: MockContext) =>
    apiError(ctx, 404, 'CRD_001', '참여자 정보를 찾을 수 없습니다.'),
  member: (ctx: MockContext) =>
    apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.'),
};

function findRole(id: string): MockRole | undefined {
  const role = getStore().roles.find((r) => r.id === id);
  return role && findPerformance(role.performanceId) ? role : undefined;
}

function hasEnsemble(performanceId: string, exceptId?: string): boolean {
  return getStore().roles.some(
    (r) =>
      r.performanceId === performanceId && r.name === null && r.id !== exceptId
  );
}

function nextRoleOrder(performanceId: string): number {
  const orders = rolesOf(performanceId).map((r) => r.sortOrder);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

/** 캐스트 배열 검사 — 배우 프로필 id 를 단원 id 로. 문제가 있으면 오류 응답 */
function readActors(
  ctx: MockContext,
  min: number
): { memberId: string; note: string | null }[] | Response {
  const list = Array.isArray(ctx.body.actors)
    ? (ctx.body.actors as Record<string, unknown>[])
    : null;
  if (!list || list.length < min || list.length > 10)
    return validationError(ctx);
  const ids = list.map((a) => toMemberId(String(a.actorProfileId ?? '')));
  if (new Set(ids).size !== ids.length)
    return validationError(ctx, '같은 배우를 두 번 넣을 수 없습니다.');
  if (ids.some((id) => !findMember(id) || !getStore().actorProfiles.has(id)))
    return apiError(ctx, 404, 'ACT_001', '배우 정보를 찾을 수 없습니다.');
  return list.map((a, i) => ({ memberId: ids[i], note: str(a.note) }));
}

function readRoleFields(
  ctx: MockContext,
  target: Partial<MockRole>,
  isCreate: boolean
): Response | null {
  const b = ctx.body;
  if (isCreate || 'name' in b) {
    if (b.name === null) target.name = null;
    else {
      const name = str(b.name)?.trim() ?? '';
      if (name.length < 1 || name.length > 50) return validationError(ctx);
      target.name = name;
    }
  }
  if ('description' in b) {
    const d = str(b.description);
    if (d && d.length > 500) return validationError(ctx);
    target.description = d;
  }
  if ('isRecruiting' in b) {
    if (typeof b.isRecruiting !== 'boolean') return validationError(ctx);
    target.isRecruiting = b.isRecruiting;
  }
  return null;
}

function readCreditLink(
  ctx: MockContext,
  current: Pick<MockCredit, 'staffId' | 'memberId' | 'displayName'>
): Pick<MockCredit, 'staffId' | 'memberId' | 'displayName'> | Response {
  const b = ctx.body;
  const staffId = 'staffId' in b ? str(b.staffId) : current.staffId;
  const memberId = 'memberId' in b ? str(b.memberId) : current.memberId;
  const displayName =
    'displayName' in b
      ? str(b.displayName)?.trim() || null
      : current.displayName;
  if (staffId && memberId)
    return apiError(
      ctx,
      400,
      'CRD_002',
      '연출진과 단원 중 하나만 연결할 수 있습니다.'
    );
  if (staffId) {
    const s = getStore().staff.find(
      (x) => x.id === staffId && x.deletedAt === null
    );
    if (!s)
      return apiError(ctx, 404, 'STF_001', '연출진 정보를 찾을 수 없습니다.');
    return { staffId, memberId: null, displayName: s.name };
  }
  if (memberId) {
    const m = findMember(memberId);
    if (!m) return notFound.member(ctx);
    return { staffId: null, memberId, displayName: m.name };
  }
  if (!displayName)
    return validationError(
      ctx,
      '이름을 입력하거나 연출진·단원을 연결해주세요.'
    );
  return { staffId: null, memberId: null, displayName };
}

function createCredit(
  ctx: MockContext,
  performanceId: string,
  isVisible: boolean
): Response {
  const title = str(ctx.body.title)?.trim() ?? '';
  if (title.length < 1 || title.length > 30) return validationError(ctx);
  const link = readCreditLink(ctx, {
    staffId: null,
    memberId: null,
    displayName: null,
  });
  if (link instanceof Response) return link;
  const orders = creditsOf(performanceId).map((c) => c.sortOrder);
  const created: MockCredit = {
    id: newId(),
    performanceId,
    title,
    ...link,
    sortOrder: orders.length ? Math.max(...orders) + 1 : 0,
    isVisible,
    createdAt: nowIso(),
  };
  getStore().credits.push(created);
  return json(toCredit(created), 201);
}

function reorder<T extends { id: string; sortOrder: number }>(
  current: T[],
  ids: unknown
): boolean {
  if (!Array.isArray(ids) || ids.length !== current.length) return false;
  const set = new Set(ids);
  if (set.size !== ids.length || !current.every((x) => set.has(x.id)))
    return false;
  (ids as string[]).forEach((id, index) => {
    const target = current.find((x) => x.id === id);
    if (target) target.sortOrder = index;
  });
  return true;
}

function memberCastItem(memberId: string, role: MockRole) {
  const store = getStore();
  const perf = store.performances.find((p) => p.id === role.performanceId);
  const firstShow = store.shows
    .filter((s) => s.performanceId === role.performanceId)
    .map((s) => s.showDate)
    .sort()[0];
  const row = store.roleCasts.find(
    (r) => r.roleId === role.id && r.showId === null && r.memberId === memberId
  );
  return {
    roleId: role.id,
    roleName: role.name,
    performanceId: role.performanceId,
    performanceTitle: perf?.title ?? '',
    performanceVisible: perf?.isVisible ?? false,
    year: firstShow ? Number(firstShow.slice(0, 4)) : null,
    note: row?.note ?? null,
    showOverrideCount: store.roleCasts.filter(
      (r) =>
        r.roleId === role.id && r.showId !== null && r.memberId === memberId
    ).length,
  };
}

export const castRoutes: MockRoute[] = [
  // ── 배역 ──
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/roles$/,
    auth: true,
    handle: (ctx) =>
      findPerformance(ctx.params.id)
        ? json({ items: rolesOf(ctx.params.id).map(toRole) })
        : notFound.perf(ctx),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/roles$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = ctx.params.id;
      if (!findPerformance(performanceId)) return notFound.perf(ctx);
      const draft: Partial<MockRole> = {
        description: null,
        isRecruiting: false,
      };
      const invalid = readRoleFields(ctx, draft, true);
      if (invalid) return invalid;
      if (draft.name === null && hasEnsemble(performanceId))
        return apiError(
          ctx,
          409,
          'ROL_004',
          '출연 묶음은 하나만 만들 수 있습니다.'
        );
      const role: MockRole = {
        id: newId(),
        performanceId,
        name: draft.name ?? null,
        description: draft.description ?? null,
        isRecruiting: draft.isRecruiting ?? false,
        sortOrder: nextRoleOrder(performanceId),
        createdAt: nowIso(),
      };
      getStore().roles.push(role);
      return json(toRole(role), 201);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/roles\/order$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformance(ctx.params.id)) return notFound.perf(ctx);
      if (!reorder(rolesOf(ctx.params.id), ctx.body.roleIds))
        return apiError(ctx, 400, 'ROL_002', '배역 순서 목록이 맞지 않습니다.');
      return json({ items: rolesOf(ctx.params.id).map(toRole) });
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/roles\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const role = findRole(ctx.params.id);
      if (!role) return notFound.role(ctx);
      const patch: Partial<MockRole> = {};
      const invalid = readRoleFields(ctx, patch, false);
      if (invalid) return invalid;
      if (patch.name === null && hasEnsemble(role.performanceId, role.id))
        return apiError(
          ctx,
          409,
          'ROL_004',
          '출연 묶음은 하나만 만들 수 있습니다.'
        );
      Object.assign(role, patch);
      return json(toRole(role));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/roles\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const role = findRole(ctx.params.id);
      if (!role) return notFound.role(ctx);
      const store = getStore();
      store.roles = store.roles.filter((r) => r.id !== role.id);
      store.roleCasts = store.roleCasts.filter((r) => r.roleId !== role.id);
      return noContent();
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/roles\/(?<id>[^/]+)\/default-cast$/,
    auth: true,
    handle: (ctx) => {
      const role = findRole(ctx.params.id);
      if (!role) return notFound.role(ctx);
      const actors = readActors(ctx, 0);
      if (actors instanceof Response) return actors;
      const store = getStore();
      store.roleCasts = store.roleCasts.filter(
        (r) => !(r.roleId === role.id && r.showId === null)
      );
      actors.forEach((a, i) =>
        store.roleCasts.push({
          roleId: role.id,
          showId: null,
          ...a,
          sortOrder: i,
        })
      );
      return json(toRole(role));
    },
  },
  // ── 회차 지정 ──
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/show-casts$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformance(ctx.params.id)) return notFound.perf(ctx);
      const shows = getStore()
        .shows.filter((s) => s.performanceId === ctx.params.id)
        .sort((a, b) =>
          `${a.showDate}${a.startTime}`.localeCompare(
            `${b.showDate}${b.startTime}`
          )
        );
      const roles = rolesOf(ctx.params.id);
      return json({
        shows: shows.map((s) => ({
          id: s.id,
          showDate: s.showDate,
          startTime: s.startTime,
        })),
        roles: roles.map((r) => ({ id: r.id, name: r.name })),
        cells: shows.flatMap((s) => roles.map((r) => toCell(r, s.id))),
      });
    },
  },
  {
    method: 'PUT',
    pattern:
      /^\/v1\/admin\/shows\/(?<showId>[^/]+)\/roles\/(?<roleId>[^/]+)\/cast$/,
    auth: true,
    handle: (ctx) => {
      const show = getStore().shows.find((s) => s.id === ctx.params.showId);
      if (!show)
        return apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
      const role = findRole(ctx.params.roleId);
      if (!role) return notFound.role(ctx);
      if (role.performanceId !== show.performanceId)
        return apiError(ctx, 400, 'ROL_003', '다른 공연의 회차·배역입니다.');
      const actors = readActors(ctx, 1);
      if (actors instanceof Response) return actors;
      const store = getStore();
      store.roleCasts = store.roleCasts.filter(
        (r) => !(r.roleId === role.id && r.showId === show.id)
      );
      actors.forEach((a, i) =>
        store.roleCasts.push({
          roleId: role.id,
          showId: show.id,
          ...a,
          sortOrder: i,
        })
      );
      return json(toCell(role, show.id));
    },
  },
  {
    method: 'DELETE',
    pattern:
      /^\/v1\/admin\/shows\/(?<showId>[^/]+)\/roles\/(?<roleId>[^/]+)\/cast$/,
    auth: true,
    handle: (ctx) => {
      const show = getStore().shows.find((s) => s.id === ctx.params.showId);
      if (!show)
        return apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
      const role = findRole(ctx.params.roleId);
      if (!role) return notFound.role(ctx);
      if (role.performanceId !== show.performanceId)
        return apiError(ctx, 400, 'ROL_003', '다른 공연의 회차·배역입니다.');
      const store = getStore();
      store.roleCasts = store.roleCasts.filter(
        (r) => !(r.roleId === role.id && r.showId === show.id)
      );
      return noContent();
    },
  },
  // ── 참여자 ──
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/credits$/,
    auth: true,
    handle: (ctx) =>
      findPerformance(ctx.params.id)
        ? json({ items: creditsOf(ctx.params.id).map(toCredit) })
        : notFound.perf(ctx),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/credits$/,
    auth: true,
    handle: (ctx) =>
      findPerformance(ctx.params.id)
        ? createCredit(ctx, ctx.params.id, ctx.body.isVisible === true)
        : notFound.perf(ctx),
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/credits\/order$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformance(ctx.params.id)) return notFound.perf(ctx);
      if (!reorder(creditsOf(ctx.params.id), ctx.body.creditIds))
        return apiError(
          ctx,
          400,
          'CRD_003',
          '참여자 순서 목록이 맞지 않습니다.'
        );
      return json({ items: creditsOf(ctx.params.id).map(toCredit) });
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/credits\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const credit = getStore().credits.find((c) => c.id === ctx.params.id);
      if (!credit) return notFound.credit(ctx);
      const b = ctx.body;
      if ('title' in b) {
        const title = str(b.title)?.trim() ?? '';
        if (title.length < 1 || title.length > 30) return validationError(ctx);
        credit.title = title;
      }
      if ('staffId' in b || 'memberId' in b || 'displayName' in b) {
        const link = readCreditLink(ctx, credit);
        if (link instanceof Response) return link;
        Object.assign(credit, link);
      }
      if ('isVisible' in b) {
        if (typeof b.isVisible !== 'boolean') return validationError(ctx);
        credit.isVisible = b.isVisible;
      }
      return json(toCredit(credit));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/credits\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      if (!store.credits.some((c) => c.id === ctx.params.id))
        return notFound.credit(ctx);
      store.credits = store.credits.filter((c) => c.id !== ctx.params.id);
      return noContent();
    },
  },
  // ── 배우 쪽 ──
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/sam-credits$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m) return notFound.member(ctx);
      const store = getStore();
      const roleIds = new Set(
        store.roleCasts
          .filter((r) => r.memberId === m.id && r.showId === null)
          .map((r) => r.roleId)
      );
      const roles = store.roles.filter(
        (r) => roleIds.has(r.id) && findPerformance(r.performanceId)
      );
      return json({
        casts: roles.map((r) => memberCastItem(m.id, r)),
        credits: store.credits
          .filter(
            (c) => c.memberId === m.id && findPerformance(c.performanceId)
          )
          .map((c) => ({
            creditId: c.id,
            title: c.title,
            performanceId: c.performanceId,
            performanceTitle: findPerformance(c.performanceId)?.title ?? '',
            isVisible: c.isVisible,
          })),
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/cast-roles$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m) return notFound.member(ctx);
      if (m.type !== 'ACTOR')
        return apiError(
          ctx,
          400,
          'ACT_002',
          '배우 등록은 단원 유형이 actor여야 합니다.'
        );
      const performanceId = str(ctx.body.performanceId) ?? '';
      if (!findPerformance(performanceId)) return notFound.perf(ctx);
      const store = getStore();
      const roleId = str(ctx.body.roleId);
      let role: MockRole | undefined;
      if (roleId) {
        role = findRole(roleId);
        if (!role) return notFound.role(ctx);
        if (role.performanceId !== performanceId)
          return apiError(ctx, 400, 'ROL_003', '다른 공연의 회차·배역입니다.');
      } else {
        role = store.roles.find(
          (r) => r.performanceId === performanceId && r.name === null
        );
        if (!role) {
          role = {
            id: newId(),
            performanceId,
            name: null,
            description: null,
            isRecruiting: false,
            sortOrder: nextRoleOrder(performanceId),
            createdAt: nowIso(),
          };
          store.roles.push(role);
        }
      }
      const target = role;
      if (
        store.roleCasts.some(
          (r) =>
            r.roleId === target.id && r.showId === null && r.memberId === m.id
        )
      )
        return apiError(
          ctx,
          409,
          'ROL_005',
          '이미 이 배역에 연결된 배우입니다.'
        );
      if (!store.actorProfiles.has(m.id))
        store.actorProfiles.set(m.id, emptyProfile(m.id));
      const rows = rowsOf(target.id, null);
      store.roleCasts.push({
        roleId: target.id,
        showId: null,
        memberId: m.id,
        note: str(ctx.body.note),
        sortOrder: rows.length
          ? Math.max(...rows.map((r) => r.sortOrder)) + 1
          : 0,
      });
      return json(memberCastItem(m.id, target), 201);
    },
  },
  {
    method: 'DELETE',
    pattern:
      /^\/v1\/admin\/members\/(?<id>[^/]+)\/cast-roles\/(?<roleId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m) return notFound.member(ctx);
      const store = getStore();
      const exists = store.roleCasts.some(
        (r) =>
          r.roleId === ctx.params.roleId &&
          r.showId === null &&
          r.memberId === m.id
      );
      if (!exists) return notFound.role(ctx);
      store.roleCasts = store.roleCasts.filter(
        (r) =>
          !(
            r.roleId === ctx.params.roleId &&
            r.showId === null &&
            r.memberId === m.id
          )
      );
      return json({
        showOverrideCount: store.roleCasts.filter(
          (r) =>
            r.roleId === ctx.params.roleId &&
            r.showId !== null &&
            r.memberId === m.id
        ).length,
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/credits$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m) return notFound.member(ctx);
      const performanceId = str(ctx.body.performanceId) ?? '';
      if (!findPerformance(performanceId)) return notFound.perf(ctx);
      return createCredit(
        { ...ctx, body: { title: ctx.body.title, memberId: m.id } },
        performanceId,
        false
      );
    },
  },
];
