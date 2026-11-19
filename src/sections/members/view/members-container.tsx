'use client';

// ----------------------------------------------------------------------
// SCR-D05 `/members` 분기 컨테이너 — 목록 영역(로딩 / 오류 / 빈 / 표)과 패널(?member=<id> 일 때) 을 고른다.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { MembersTable } from '@/src/sections/members/components/members-table';
import { MemberPanelContainer } from '@/src/sections/members/view/member-panel-container';
import { MembersView } from '@/src/sections/members/view/members-view';
import { useMembersViewModel } from '@/src/sections/members/view/use-members-view-model';
import { MSG_D05 } from '@/src/shared/messages/d05';

export function MembersContainer() {
  const vm = useMembersViewModel();
  const { list } = vm;

  const listNode = list.isLoading ? (
    <TableSkeleton />
  ) : list.errorMessage ? (
    <ErrorRetry message={list.errorMessage} onRetry={list.onRetry} />
  ) : list.rows.length === 0 ? (
    <EmptyContent message={MSG_D05.EMPTY} />
  ) : (
    <MembersTable
      rows={list.rows}
      selectedId={vm.selectedId}
      onSelect={vm.onSelect}
    />
  );

  return (
    <MembersView
      filterOptions={vm.filterOptions}
      filter={vm.filter}
      onFilterChange={vm.onFilterChange}
      list={listNode}
      page={list.page}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      panel={
        vm.selectedId ? (
          <MemberPanelContainer
            memberId={vm.selectedId}
            onClose={vm.onClosePanel}
          />
        ) : null
      }
      addDialog={vm.addDialog}
    />
  );
}
