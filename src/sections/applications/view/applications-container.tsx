'use client';

// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 Container — 목록 칸 상태 분기(로딩 스켈레톤 · 오류 다시 시도 · 빈 · 표)만 한다.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { ApplicationTable } from '@/src/sections/applications/components/application-table';
import { ApplicationsView } from '@/src/sections/applications/view/applications-view';
import { useApplicationsViewModel } from '@/src/sections/applications/view/use-applications-view-model';

export function ApplicationsContainer() {
  const vm = useApplicationsViewModel();

  let list;
  if (vm.isLoading) list = <TableSkeleton cardBelow='lg' />;
  else if (vm.isError)
    list = <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />;
  else if (vm.rows.length === 0)
    list = (
      <EmptyContent
        message={vm.emptyMessage}
        icon='solar:document-text-linear'
      />
    );
  else
    list = (
      <ApplicationTable
        appType={vm.appType}
        rows={vm.rows}
        handlers={{
          onView: vm.onView,
          onRequestApprove: vm.onRequestApprove,
          onRequestReject: vm.onRequestReject,
          onRequestRegister: vm.onRequestRegister,
        }}
      />
    );

  return <ApplicationsView vm={vm} list={list} />;
}
