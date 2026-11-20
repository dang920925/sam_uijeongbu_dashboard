'use client';

// ----------------------------------------------------------------------
// 배우 프로필 패널 컨테이너 — ViewModel 을 불러 View(MembersActorProfileForm)에 넘긴다.
// R3: 아래에 'SAM 출연작'·'참여 직함'(MembersSamCredits — 프로필 저장과 따로 바로 저장되는 별도 ViewModel).
// ----------------------------------------------------------------------
import Divider from '@mui/material/Divider';

import { MembersActorProfileForm } from '@/src/sections/members/components/members-actor-profile-form';
import { MembersSamCredits } from '@/src/sections/members/components/members-sam-credits';
import { useActorProfileViewModel } from '@/src/sections/members/view/use-actor-profile-view-model';
import { useSamCreditsViewModel } from '@/src/sections/members/view/use-sam-credits-view-model';
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
  const sam = useSamCreditsViewModel(member.id);
  return (
    <div className='flex flex-col gap-6'>
      <MembersActorProfileForm vm={vm} />
      <Divider />
      <MembersSamCredits vm={sam} />
    </div>
  );
}
