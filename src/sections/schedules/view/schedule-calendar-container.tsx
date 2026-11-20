'use client';

// ----------------------------------------------------------------------
// SCR-D08 캘린더 본문 Container — 보기 분기(주 · xs 아젠다/빈 달 · 월 격자)와 오류 "다시 시도"만 고른다.
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { ScheduleAgenda } from '@/src/sections/schedules/components/schedule-agenda';
import { ScheduleCalendarFrame } from '@/src/sections/schedules/components/schedule-calendar-frame';
import { ScheduleMonthGrid } from '@/src/sections/schedules/components/schedule-month-grid';
import { ScheduleWeekGrid } from '@/src/sections/schedules/components/schedule-week-grid';
import type { SchedulesViewModel } from '@/src/sections/schedules/view/use-schedules-view-model';
import { MSG_D08 } from '@/src/shared/messages/d08';

export function ScheduleCalendarContainer({ vm }: { vm: SchedulesViewModel }) {
  const { calendar } = vm;
  let content = null;
  if (calendar.view === 'week')
    content = <ScheduleWeekGrid {...vm.weekGridProps} />;
  else if (!vm.isXs) content = <ScheduleMonthGrid {...vm.monthGridProps} />;
  else if (calendar.agendaDays.length > 0)
    content = <ScheduleAgenda {...vm.agendaProps} />;
  else if (!calendar.isPending)
    content = (
      <EmptyContent
        message={MSG_D08.MONTH_EMPTY}
        icon='solar:calendar-linear'
      />
    );

  const error = vm.isCalendarError ? (
    <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />
  ) : null;
  return (
    <ScheduleCalendarFrame {...vm.frameProps} error={error}>
      {content}
    </ScheduleCalendarFrame>
  );
}
