'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 Container — 보기 분기(월·주 = 캘린더 Container / 목록 = 로딩 스켈레톤 · 오류 다시 시도 · 빈 · 표)만 한다.
// 오늘(KST)은 서버 page 가 요청 시각으로 계산해 넘긴다(하이드레이션 일치).
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { ScheduleTable } from '@/src/sections/schedules/components/schedule-table';
import { ScheduleCalendarContainer } from '@/src/sections/schedules/view/schedule-calendar-container';
import { SchedulesView } from '@/src/sections/schedules/view/schedules-view';
import { useSchedulesViewModel } from '@/src/sections/schedules/view/use-schedules-view-model';
import { MSG_D08 } from '@/src/shared/messages/d08';

export function SchedulesContainer({ today }: { today: string }) {
  const vm = useSchedulesViewModel(today);

  let body;
  if (vm.calendar.view !== 'list') body = <ScheduleCalendarContainer vm={vm} />;
  else if (vm.isLoading) body = <TableSkeleton cardBelow='lg' />;
  else if (vm.isError)
    body = <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />;
  else if (vm.rows.length === 0)
    body = (
      <EmptyContent message={MSG_D08.EMPTY} icon='solar:calendar-linear' />
    );
  else body = <ScheduleTable rows={vm.rows} handlers={vm.rowHandlers} />;

  return <SchedulesView vm={vm} body={body} />;
}
