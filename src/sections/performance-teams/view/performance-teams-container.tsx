'use client';

// ----------------------------------------------------------------------
// U34 `/performances/[id]/teams` 분기 컨테이너 — 공연 404·조회 오류는 D04 상태 카드, 그 밖은 View.
// ----------------------------------------------------------------------
import { PageContainer } from '@/src/components/page-container';
import { PerformanceDetailStateCard } from '@/src/sections/performance-detail/components/performance-detail-state-card';
import { PerformanceTeamsView } from '@/src/sections/performance-teams/view/performance-teams-view';
import { usePerformanceTeamsViewModel } from '@/src/sections/performance-teams/view/use-performance-teams-view-model';

interface PerformanceTeamsContainerProps {
  performanceId: string;
}

export function PerformanceTeamsContainer({
  performanceId,
}: PerformanceTeamsContainerProps) {
  const vm = usePerformanceTeamsViewModel(performanceId);
  if (vm.status !== 'ready') {
    return (
      <PageContainer>
        <PerformanceDetailStateCard
          errorMessage={vm.status === 'error' ? vm.errorMessage : null}
          onRetry={vm.onRetry}
        />
      </PageContainer>
    );
  }
  return <PerformanceTeamsView performanceId={performanceId} vm={vm} />;
}
