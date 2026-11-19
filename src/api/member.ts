// ----------------------------------------------------------------------
// 단원·배우 프로필 요청 함수(FN-11·12) — develop §3.4.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromActorProfileResponse,
  fromMemberListItemResponse,
  toActorProfileUpsertRequest,
  toMemberCreateRequest,
} from '@/src/api/member-mapper';
import {
  ApiError,
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  withQuery,
} from '@/src/lib/api-client';
import type { Paginated } from '@/src/types/common';
import type {
  ActorProfile,
  ActorProfileResponse,
  Member,
  MemberFormInput,
  MemberListItemResponse,
  MemberListQuery,
  MemberUpdateRequest,
} from '@/src/types/member';

export async function fetchMembers(
  query: MemberListQuery
): Promise<Paginated<Member>> {
  const res = await apiFetch<Paginated<MemberListItemResponse>>(
    withQuery(endpoints.members.list, query)
  );
  return { ...res, items: res.items.map(fromMemberListItemResponse) };
}

/** develop §3.1 MEM_001 문구 */
const MEMBER_NOT_FOUND_MESSAGE = '단원 정보를 찾을 수 없습니다.';

/**
 * 상세 GET 의 id 형식 오류(400 COMMON_001 — `?member=<UUID 아님>`)는 "없는 단원"과 같다 →
 * MEM_001 과 같은 404·문구로 바꾼다(D04 공연 상세 선례, qa1 QA1-023).
 */
export function toMemberNotFoundIfInvalidId(error: unknown): unknown {
  if (
    !(error instanceof ApiError) ||
    error.status !== 400 ||
    error.code !== 'COMMON_001'
  ) {
    return error;
  }
  return new ApiError(404, {
    statusCode: 404,
    status: 'Not Found',
    message: MEMBER_NOT_FOUND_MESSAGE,
    code: 'MEM_001',
    timestamp: error.payload?.timestamp ?? '',
    path: error.payload?.path ?? '',
  });
}

export async function fetchMember(id: string): Promise<Member> {
  try {
    return fromMemberListItemResponse(
      await apiFetch<MemberListItemResponse>(endpoints.members.detail(id))
    );
  } catch (error: unknown) {
    throw toMemberNotFoundIfInvalidId(error);
  }
}

export async function createMember(input: MemberFormInput): Promise<Member> {
  return fromMemberListItemResponse(
    await apiPost<MemberListItemResponse>(
      endpoints.members.list,
      toMemberCreateRequest(input)
    )
  );
}

export async function saveMember(
  id: string,
  input: MemberUpdateRequest
): Promise<Member> {
  return fromMemberListItemResponse(
    await apiPatch<MemberListItemResponse>(endpoints.members.detail(id), input)
  );
}

export async function deleteMember(id: string): Promise<void> {
  await apiDelete(endpoints.members.detail(id));
}

export async function fetchActorProfile(
  memberId: string
): Promise<ActorProfile> {
  return fromActorProfileResponse(
    await apiFetch<ActorProfileResponse>(
      endpoints.members.actorProfile(memberId)
    )
  );
}

export async function saveActorProfile(
  profile: ActorProfile
): Promise<ActorProfile> {
  return fromActorProfileResponse(
    await apiPatch<ActorProfileResponse>(
      endpoints.members.actorProfile(profile.memberId),
      toActorProfileUpsertRequest(profile)
    )
  );
}
