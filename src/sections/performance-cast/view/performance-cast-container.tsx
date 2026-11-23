'use client';

// ----------------------------------------------------------------------
// SCR-D14 `/performances/[id]/cast` 분기 컨테이너 — 공연 404(PERF_001)·조회 오류는 D04 상태 카드,
// 그 밖은 View(본문 로딩·오류·내용은 View 가 bodyStatus 로 나눈다 — SCR-D11 과 같은 방식).
// ----------------------------------------------------------------------
import { PageContainer } from '@/src/components/page-container';
import { PerformanceDetailStateCard } from '@/src/sections/performance-detail/components/performance-detail-state-card';
import { PerformanceCastView } from '@/src/sections/performance-cast/view/performance-cast-view';
import { usePerformanceCastViewModel } from '@/src/sections/performance-cast/view/use-performance-cast-view-model';

interface PerformanceCastContainerProps {
  performanceId: string;
  clientPublicUrl: string | null;
}

export function PerformanceCastContainer({
  performanceId,
  clientPublicUrl,
}: PerformanceCastContainerProps) {
  const vm = usePerformanceCastViewModel(performanceId, clientPublicUrl);

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
  return <PerformanceCastView performanceId={performanceId} vm={vm} />;
}
