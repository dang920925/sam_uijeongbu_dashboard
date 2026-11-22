// ----------------------------------------------------------------------
// 단원·배우 프로필 매퍼(FN-11·12). 폼의 빈 연락처는 null, 이름은 앞뒤 공백 제거.
// ----------------------------------------------------------------------
import type {
  ActorProfile,
  ActorProfileResponse,
  ActorProfileUpsertRequest,
  Member,
  MemberCreateRequest,
  MemberFormInput,
  MemberListItemResponse,
} from '@/src/types/member';

export function fromMemberListItemResponse(
  res: MemberListItemResponse
): Member {
  return {
    id: res.id,
    name: res.name,
    type: res.type,
    phone: res.phone ?? null,
    isVisible: res.isVisible,
    joinedAt: res.joinedAt ?? null,
    publicConsentAt: res.publicConsentAt ?? null,
    createdAt: res.createdAt,
    profileImageUrl: res.profileImageUrl ?? null,
    inviterListed: res.inviterListed !== false,
    actorProfileId: res.actorProfileId ?? null,
  };
}

export function toMemberCreateRequest(
  input: MemberFormInput
): MemberCreateRequest {
  const phone = input.phone.trim();
  return {
    name: input.name.trim(),
    phone: phone === '' ? null : phone,
    type: input.type,
  };
}

export function fromActorProfileResponse(
  res: ActorProfileResponse
): ActorProfile {
  return {
    memberId: res.memberId,
    profileImageUrl: res.profileImageUrl ?? null,
    intro: res.intro ?? null,
    snsUrl: res.snsUrl ?? null,
    activityStart: res.activityStart ?? null,
    displayOrder: res.displayOrder ?? 0,
    filmography: (res.filmography ?? []).map((f) => ({
      title: f.title,
      role: f.role ?? null,
      year: f.year,
    })),
  };
}

/** 프로필 → 요청 바디(부분 갱신이지만 패널은 전 필드를 보낸다. filmography 는 전체 교체) */
export function toActorProfileUpsertRequest(
  profile: ActorProfile
): ActorProfileUpsertRequest {
  const blankToNull = (v: string | null) =>
    v === null || v.trim() === '' ? null : v.trim();
  return {
    profileImageUrl: profile.profileImageUrl,
    intro: blankToNull(profile.intro),
    snsUrl: blankToNull(profile.snsUrl),
    activityStart: blankToNull(profile.activityStart),
    displayOrder: profile.displayOrder,
    filmography: profile.filmography.map((f) => ({
      title: f.title.trim(),
      role: blankToNull(f.role),
      year: f.year,
    })),
  };
}
