'use client';

// ----------------------------------------------------------------------
// 공연 관리(SCR-D03) 컨테이너 — 카드 안 상태 분기: 로딩(표·카드 스켈레톤) / 오류(다시 시도) / 빈 / 목록.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { PerformanceListPageShell } from '@/src/sections/performance-list/components/performance-list-page-shell';
import { PerformanceListView } from '@/src/sections/performance-list/view/performance-list-view';
import { usePerformanceListViewModel } from '@/src/sections/performance-list/view/use-performance-list-view-model';
import { MSG_D03 } from '@/src/shared/messages/d03';

export function PerformanceListContainer() {
  const { dialog, ...vm } = usePerformanceListViewModel();
  const body = vm.isLoading ? (
    <TableSkeleton />
  ) : vm.isError ? (
    <ErrorRetry message={MSG_D03.ERROR} onRetry={vm.onRetry} />
  ) : vm.rows.length === 0 ? (
    <EmptyContent message={MSG_D03.EMPTY} />
  ) : (
    <PerformanceListView
      rows={vm.rows}
      page={vm.page}
      totalPages={vm.totalPages}
      hasPagination={vm.hasPagination}
      onPageChange={vm.onPageChange}
      onRowClick={vm.onRowClick}
    />
  );
  return (
    <PerformanceListPageShell onAdd={dialog.onOpen} dialog={dialog}>
      {body}
    </PerformanceListPageShell>
  );
}
