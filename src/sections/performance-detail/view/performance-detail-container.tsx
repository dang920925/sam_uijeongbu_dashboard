'use client';

// ----------------------------------------------------------------------
// SCR-D04 `/performances/[id]` 분기 컨테이너 — 로딩 / 404(PERF_001) / 조회 오류 / 상세.
// ----------------------------------------------------------------------
import { PageContainer } from '@/src/components/page-container';
import { PerformanceDetailSkeleton } from '@/src/sections/performance-detail/components/performance-detail-skeleton';
import { PerformanceDetailStateCard } from '@/src/sections/performance-detail/components/performance-detail-state-card';
import { PerformanceDetailView } from '@/src/sections/performance-detail/view/performance-detail-view';
import { usePerformanceDetailViewModel } from '@/src/sections/performance-detail/view/use-performance-detail-view-model';

interface PerformanceDetailContainerProps {
  performanceId: string;
}

export function PerformanceDetailContainer({
  performanceId,
}: PerformanceDetailContainerProps) {
  const vm = usePerformanceDetailViewModel(performanceId);

  if (vm.status === 'loading') {
    return (
      <PageContainer>
        <PerformanceDetailSkeleton />
      </PageContainer>
    );
  }
  if (vm.status !== 'ready' || !vm.info) {
    return (
      <PageContainer>
        <PerformanceDetailStateCard
          errorMessage={vm.status === 'error' ? vm.errorMessage : null}
          onRetry={vm.onRetry}
        />
      </PageContainer>
    );
  }
  return (
    <PerformanceDetailView
      performanceId={performanceId}
      info={vm.info}
      classSection={vm.classSection}
      classDialog={vm.classDialog}
      editDialog={vm.editDialog}
      deleteConfirm={vm.deleteConfirm}
      performanceDelete={vm.performanceDelete}
    />
  );
}
