'use client';

// ----------------------------------------------------------------------
// SCR-D11 `/performances/[id]/shows` 분기 컨테이너 — 공연 404(PERF_001)·조회 오류는 D04 상태 카드,
// 그 밖은 View(본문 로딩·오류·내용은 View 가 bodyStatus 로 나눈다).
// ----------------------------------------------------------------------
import { PageContainer } from '@/src/components/page-container';
import { PerformanceDetailStateCard } from '@/src/sections/performance-detail/components/performance-detail-state-card';
import { PerformanceShowsView } from '@/src/sections/performance-shows/view/performance-shows-view';
import { usePerformanceShowsViewModel } from '@/src/sections/performance-shows/view/use-performance-shows-view-model';

interface PerformanceShowsContainerProps {
  performanceId: string;
}

export function PerformanceShowsContainer({
  performanceId,
}: PerformanceShowsContainerProps) {
  const vm = usePerformanceShowsViewModel(performanceId);

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
  return <PerformanceShowsView performanceId={performanceId} vm={vm} />;
}
