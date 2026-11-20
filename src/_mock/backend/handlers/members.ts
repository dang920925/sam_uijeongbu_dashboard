// ----------------------------------------------------------------------
// 목 단원·배우 프로필(FN-11·12) — develop §3.4. joinedAt = 오늘(KST), 프로필은 ACTOR 만(400 ACT_002).
// 목록 응답에 아바타(profileImageUrl) 포함(design SCR-D05 "행마다 프로필 조회 → 목록 응답에 포함").
// ----------------------------------------------------------------------
import {
  apiError,
  byCreatedDesc,
  isAllowedImageUrl,
  isHttpsUrl,
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
import { todayKst } from '@/src/utils/kst-date-format';
import type { MemberType } from '@/src/types/codes';
import type {
  ActorProfileResponse,
  MemberListItemResponse,
} from '@/src/types/member';

const PHONE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export function findMember(id: string) {
  return getStore().members.find((m) => m.id === id && m.deletedAt === null);
}

export function toMemberItem(
  m: SoftDeleted<MemberListItemResponse>
): MemberListItemResponse {
  const { deletedAt: _deletedAt, ...rest } = m;
  const profile = getStore().actorProfiles.get(m.id);
  return { ...rest, profileImageUrl: profile?.profileImageUrl ?? null };
}

/** 단원 생성(신청서 "단원으로 등록"도 이 함수를 쓴다 — W3 applications 목 핸들러) */
export function createMemberRecord(
  ctx: MockContext,
  input: Record<string, unknown>
): SoftDeleted<MemberListItemResponse> | Response {
  const name = str(input.name)?.trim() ?? '';
  if (name.length < 1 || name.length > 50)
    return validationError(ctx, '이름을 입력해주세요');
  const phone = str(input.phone)?.trim() || null;
  if (phone && !PHONE.test(phone))
    return validationError(ctx, '올바른 연락처 형식이 아닙니다.');
  const type = input.type as MemberType;
  if (!['GENERAL', 'ACTOR'].includes(type)) return validationError(ctx);
  const created: SoftDeleted<MemberListItemResponse> = {
    id: newId(),
    name,
    type,
    phone,
    isVisible: false,
    inviterListed: true,
    joinedAt: todayKst(),
    createdAt: nowIso(),
    profileImageUrl: null,
    deletedAt: null,
  };
  getStore().members.push(created);
  return created;
}

function emptyProfile(memberId: string): ActorProfileResponse {
  return {
    memberId,
    profileImageUrl: null,
    intro: null,
    snsUrl: null,
    activityStart: null,
    displayOrder: 0,
    filmography: [],
  };
}

export const memberRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/members$/,
    auth: true,
    handle: (ctx) => {
      const type = ctx.query.get('type');
      const items = getStore()
        .members.filter(
          (m) => m.deletedAt === null && (!type || m.type === type)
        )
        .sort(byCreatedDesc)
        .map(toMemberItem);
      return json(paginate(items, ctx.query));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/members$/,
    auth: true,
    handle: (ctx) => {
      const created = createMemberRecord(ctx, ctx.body);
      return created instanceof Response
        ? created
        : json(toMemberItem(created), 201);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      // 실서버 UuidParamPipe 처럼 형식이 틀린 id 는 400 COMMON_001(qa1 QA1-023 재현용)
      if (!/^[0-9a-f-]{36}$/i.test(ctx.params.id)) {
        return validationError(ctx, 'id 형식이 올바르지 않습니다.');
      }
      const m = findMember(ctx.params.id);
      return m
        ? json(toMemberItem(m))
        : apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m)
        return apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
      const b = ctx.body;
      if ('name' in b) {
        const name = str(b.name)?.trim() ?? '';
        if (!name || name.length > 50)
          return validationError(ctx, '이름을 입력해주세요');
        m.name = name;
      }
      if ('phone' in b) m.phone = str(b.phone)?.trim() || null;
      if ('type' in b && ['GENERAL', 'ACTOR'].includes(b.type as string))
        m.type = b.type as MemberType;
      if ('isVisible' in b) m.isVisible = b.isVisible === true;
      // U36 예매 초대자 목록 표시
      if ('inviterListed' in b) {
        if (typeof b.inviterListed !== 'boolean') return validationError(ctx);
        m.inviterListed = b.inviterListed;
      }
      return json(toMemberItem(m));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m)
        return apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
      m.deletedAt = nowIso();
      return noContent();
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/actor-profile$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m)
        return apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
      if (m.type !== 'ACTOR')
        return apiError(
          ctx,
          400,
          'ACT_002',
          '배우 등록은 단원 유형이 actor여야 합니다.'
        );
      return json(getStore().actorProfiles.get(m.id) ?? emptyProfile(m.id));
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/actor-profile$/,
    auth: true,
    handle: (ctx) => {
      const m = findMember(ctx.params.id);
      if (!m)
        return apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
      if (m.type !== 'ACTOR')
        return apiError(
          ctx,
          400,
          'ACT_002',
          '배우 등록은 단원 유형이 actor여야 합니다.'
        );
      const b = ctx.body;
      const profile = {
        ...(getStore().actorProfiles.get(m.id) ?? emptyProfile(m.id)),
      };
      if ('intro' in b) {
        const intro = str(b.intro);
        if (intro && intro.length > 200)
          return validationError(
            ctx,
            '한 줄 소개는 200자 이내로 입력해주세요.'
          );
        profile.intro = intro;
      }
      if ('snsUrl' in b) {
        if (b.snsUrl !== null && !isHttpsUrl(b.snsUrl))
          return validationError(ctx);
        profile.snsUrl = str(b.snsUrl);
      }
      if ('profileImageUrl' in b) {
        if (
          b.profileImageUrl !== null &&
          !isAllowedImageUrl(b.profileImageUrl)
        ) {
          return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
        }
        profile.profileImageUrl = str(b.profileImageUrl);
      }
      if ('activityStart' in b) profile.activityStart = str(b.activityStart);
      if ('displayOrder' in b) {
        const order = Number(b.displayOrder);
        if (!Number.isInteger(order) || order < 0 || order > 9999)
          return validationError(ctx);
        profile.displayOrder = order;
      }
      if ('filmography' in b) {
        const list = Array.isArray(b.filmography)
          ? (b.filmography as Record<string, unknown>[])
          : [];
        const valid = list.every((f) => {
          const title = str(f.title)?.trim() ?? '';
          const year = Number(f.year);
          return (
            title.length >= 1 &&
            title.length <= 100 &&
            Number.isInteger(year) &&
            year >= 1900 &&
            year <= 2100
          );
        });
        if (!valid || list.length > 100) return validationError(ctx);
        profile.filmography = list.map((f) => ({
          title: String(f.title).trim(),
          role: str(f.role),
          year: Number(f.year),
        }));
      }
      getStore().actorProfiles.set(m.id, profile);
      return json(profile);
    },
  },
];
