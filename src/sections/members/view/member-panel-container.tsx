'use client';

// ----------------------------------------------------------------------
// 단원 상세 패널 분기 컨테이너 — 로딩 / 오류(다시 시도) / 배우(프로필 폼) / 일반(연락처·가입일).
// 배우 폼은 단원 id 를 key 로 다시 마운트해 단원이 바뀌면 입력을 새로 채운다.
// ----------------------------------------------------------------------
import { ErrorRetry } from '@/src/components/error-retry';
import { MembersGeneralInfo } from '@/src/sections/members/components/members-general-info';
import { MembersPanelSkeleton } from '@/src/sections/members/components/members-panel-skeleton';
import { ActorProfileContainer } from '@/src/sections/members/view/actor-profile-container';
import { MemberPanelView } from '@/src/sections/members/view/member-panel-view';
import { useMemberPanelViewModel } from '@/src/sections/members/view/use-member-panel-view-model';

interface MemberPanelContainerProps {
  memberId: string;
  onClose: () => void;
}

export function MemberPanelContainer({
  memberId,
  onClose,
}: MemberPanelContainerProps) {
  const vm = useMemberPanelViewModel(memberId, onClose);

  const content = vm.isLoading ? (
    <MembersPanelSkeleton />
  ) : vm.errorMessage || !vm.member ? (
    <ErrorRetry message={vm.errorMessage ?? ''} onRetry={vm.onRetry} />
  ) : vm.profile ? (
    <ActorProfileContainer
      key={vm.member.id}
      member={vm.member}
      profile={vm.profile}
    />
  ) : vm.general ? (
    <MembersGeneralInfo
      phoneText={vm.general.phoneText}
      joinedText={vm.general.joinedText}
    />
  ) : null;

  return (
    <MemberPanelView
      title={vm.title}
      onClose={vm.onClose}
      canDelete={Boolean(vm.member) && !vm.isLoading}
      deleteConfirm={vm.deleteConfirm}
      inviterSwitch={vm.isLoading ? null : vm.inviterSwitch}
    >
      {content}
    </MemberPanelView>
  );
}
