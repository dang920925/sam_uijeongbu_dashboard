'use client';

// ----------------------------------------------------------------------
// 배우 프로필 패널 컨테이너 — ViewModel 을 불러 View(MembersActorProfileForm)에 넘긴다.
// ----------------------------------------------------------------------
import { MembersActorProfileForm } from '@/src/sections/members/components/members-actor-profile-form';
import { useActorProfileViewModel } from '@/src/sections/members/view/use-actor-profile-view-model';
import type { ActorProfile, Member } from '@/src/types/member';

interface ActorProfileContainerProps {
  member: Member;
  profile: ActorProfile;
}

export function ActorProfileContainer({
  member,
  profile,
}: ActorProfileContainerProps) {
  const vm = useActorProfileViewModel(member, profile);
  return <MembersActorProfileForm vm={vm} />;
}
