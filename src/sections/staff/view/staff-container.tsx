'use client';

// ----------------------------------------------------------------------
// 연출진 관리(SCR-D09) 컨테이너 — 표 영역 상태 분기만: 로딩 스켈레톤 / 오류 "다시 시도" / 빈 / 표.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { StaffTable } from '@/src/sections/staff/components/staff-table';
import { StaffView } from '@/src/sections/staff/view/staff-view';
import { useStaffViewModel } from '@/src/sections/staff/view/use-staff-view-model';
import { MSG_D09 } from '@/src/shared/messages/d09';

export function StaffContainer() {
  const vm = useStaffViewModel();

  const content = vm.isLoading ? (
    <TableSkeleton />
  ) : vm.isError ? (
    <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />
  ) : vm.rows.length === 0 ? (
    <EmptyContent message={MSG_D09.EMPTY} icon='solar:clapperboard-linear' />
  ) : (
    <StaffTable
      rows={vm.rows}
      onEdit={vm.onEdit}
      onDelete={vm.onDeleteRequest}
    />
  );

  return (
    <StaffView
      content={content}
      onAdd={vm.onAdd}
      dialog={vm.dialog}
      deleteConfirm={vm.deleteConfirm}
    />
  );
}
