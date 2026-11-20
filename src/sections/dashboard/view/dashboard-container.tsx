'use client';

// ----------------------------------------------------------------------
// 요약(SCR-D02) 컨테이너 — 로딩(스켈레톤) / 오류(문구 + 다시 시도) / 기본(빈 목록 문구는 View 가) 분기.
// ----------------------------------------------------------------------
import { DashboardErrorCard } from '@/src/sections/dashboard/components/dashboard-error-card';
import { DashboardPageShell } from '@/src/sections/dashboard/components/dashboard-page-shell';
import { DashboardSkeleton } from '@/src/sections/dashboard/components/dashboard-skeleton';
import { DashboardView } from '@/src/sections/dashboard/view/dashboard-view';
import { useDashboardViewModel } from '@/src/sections/dashboard/view/use-dashboard-view-model';

export function DashboardContainer() {
  const vm = useDashboardViewModel();
  if (vm.isLoading) {
    return (
      <DashboardPageShell>
        <DashboardSkeleton />
      </DashboardPageShell>
    );
  }
  if (vm.isError) {
    return (
      <DashboardPageShell>
        <DashboardErrorCard onRetry={vm.onRetry} />
      </DashboardPageShell>
    );
  }
  return (
    <DashboardPageShell>
      <DashboardView
        kpis={vm.kpis}
        recentRows={vm.recentRows}
        pendingRows={vm.pendingRows}
      />
    </DashboardPageShell>
  );
}
