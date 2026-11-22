'use client';

// ----------------------------------------------------------------------
// SCR-D12 '입금 알림' 탭 Container(R2) — 목록 칸 분기만(스켈레톤 · 오류 다시 시도 · 빈 상태 · 표).
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { DepositNotificationTable } from '@/src/sections/deposit-notifications/components/deposit-notification-table';
import { DepositNotificationsView } from '@/src/sections/deposit-notifications/view/deposit-notifications-view';
import { useDepositNotificationsViewModel } from '@/src/sections/deposit-notifications/view/use-deposit-notifications-view-model';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

export function DepositNotificationsContainer() {
  const vm = useDepositNotificationsViewModel();
  let list;
  if (vm.isLoading) list = <TableSkeleton cardBelow='lg' rows={3} />;
  else if (vm.isError)
    list = <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />;
  else if (vm.rows.length === 0)
    list = (
      <EmptyContent
        message={vm.hasFilter ? MSG_DEP.EMPTY_FILTERED : MSG_DEP.EMPTY}
      />
    );
  else
    list = (
      <DepositNotificationTable
        rows={vm.rows}
        busyId={vm.busyId}
        onMatch={vm.match.onOpen}
        onIgnore={vm.onIgnore}
      />
    );
  return <DepositNotificationsView vm={vm} list={list} />;
}
