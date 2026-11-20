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
  /** 서버 env CLIENT_PUBLIC_URL(등급 링크 앞부분) — 없으면 null */
  clientPublicUrl: string | null;
}

export function PerformanceShowsContainer({
  performanceId,
  clientPublicUrl,
}: PerformanceShowsContainerProps) {
  const vm = usePerformanceShowsViewModel(performanceId, clientPublicUrl);

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
