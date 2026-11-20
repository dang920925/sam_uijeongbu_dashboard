'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 Container — 목록 칸 상태 분기(로딩 스켈레톤 · 오류 다시 시도 · 빈 · 표)만 한다.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { ScheduleTable } from '@/src/sections/schedules/components/schedule-table';
import { SchedulesView } from '@/src/sections/schedules/view/schedules-view';
import { useSchedulesViewModel } from '@/src/sections/schedules/view/use-schedules-view-model';
import { MSG_D08 } from '@/src/shared/messages/d08';

export function SchedulesContainer() {
  const vm = useSchedulesViewModel();

  let list;
  if (vm.isLoading) list = <TableSkeleton cardBelow='lg' />;
  else if (vm.isError)
    list = <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />;
  else if (vm.rows.length === 0)
    list = (
      <EmptyContent message={MSG_D08.EMPTY} icon='solar:calendar-linear' />
    );
  else
    list = (
      <ScheduleTable
        rows={vm.rows}
        handlers={{ onEdit: vm.onOpenEdit, onDelete: vm.onRequestDelete }}
      />
    );

  return <SchedulesView vm={vm} list={list} />;
}
