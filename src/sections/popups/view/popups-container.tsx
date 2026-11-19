'use client';

// ----------------------------------------------------------------------
// 팝업 관리(SCR-D10) 컨테이너 — 표 영역 상태 분기만: 로딩 스켈레톤 / 오류 "다시 시도" / 빈 / 표.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { PopupTable } from '@/src/sections/popups/components/popup-table';
import { PopupsView } from '@/src/sections/popups/view/popups-view';
import { usePopupsViewModel } from '@/src/sections/popups/view/use-popups-view-model';
import { MSG_D10 } from '@/src/shared/messages/d10';

export function PopupsContainer() {
  const vm = usePopupsViewModel();

  const content = vm.isLoading ? (
    <TableSkeleton cardBelow='lg' />
  ) : vm.isError ? (
    <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />
  ) : vm.rows.length === 0 ? (
    <EmptyContent message={MSG_D10.EMPTY} icon='solar:window-frame-linear' />
  ) : (
    <PopupTable
      rows={vm.rows}
      onEdit={vm.onEdit}
      onDelete={vm.onDeleteRequest}
    />
  );

  return (
    <PopupsView
      content={content}
      onAdd={vm.onAdd}
      dialog={vm.dialog}
      deleteConfirm={vm.deleteConfirm}
    />
  );
}
