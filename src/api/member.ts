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

export async function fetchMember(id: string): Promise<Member> {
  return fromMemberListItemResponse(
    await apiFetch<MemberListItemResponse>(endpoints.members.detail(id))
  );
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
