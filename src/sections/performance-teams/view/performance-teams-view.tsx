'use client';

// ----------------------------------------------------------------------
// U34 '팀 계정' 탭 View — 공연 상세 머리(탭 '팀 계정') → 본문: 로딩 / 오류 "다시 시도"(TEAM_004 기능 꺼짐 포함) / 팀 계정 카드.
// + 재발급 확인. props 만으로 렌더.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import { PageContainer } from '@/src/components/page-container';
import { SectionStack } from '@/src/components/section-stack';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { PerformanceDetailHead } from '@/src/sections/performance-detail/components/performance-detail-head';
import { TeamAccountsCard } from '@/src/sections/performance-teams/components/team-accounts-card';
import type { PerformanceTeamsViewModel } from '@/src/sections/performance-teams/view/use-performance-teams-view-model';
import { MSG_TEAMS } from '@/src/shared/messages/team-accounts';

interface PerformanceTeamsViewProps {
  performanceId: string;
  vm: PerformanceTeamsViewModel;
}

export function PerformanceTeamsView({
  performanceId,
  vm,
}: PerformanceTeamsViewProps) {
  const body =
    vm.bodyStatus === 'loading' ? (
      <Card>
        <TableSkeleton />
      </Card>
    ) : vm.bodyStatus === 'error' ? (
      <Card>
        <ErrorRetry
          message={vm.bodyErrorMessage ?? ''}
          onRetry={vm.onBodyRetry}
        />
      </Card>
    ) : (
      <TeamAccountsCard card={vm.card} />
    );

  return (
    <PageContainer>
      <SectionStack>
        <PerformanceDetailHead
          performanceId={performanceId}
          title={vm.title ?? <Skeleton variant='text' width={160} />}
          current='teams'
        />
        {body}
      </SectionStack>
      <ConfirmDialog
        open={vm.reissueConfirm.isOpen}
        message={MSG_TEAMS.REISSUE_CONFIRM}
        description={vm.reissueConfirm.description}
        confirmLabel={MSG_TEAMS.REISSUE}
        confirmColor='primary'
        isLoading={vm.reissueConfirm.isLoading}
        onConfirm={vm.reissueConfirm.onConfirm}
        onCancel={vm.reissueConfirm.onCancel}
      />
    </PageContainer>
  );
}
