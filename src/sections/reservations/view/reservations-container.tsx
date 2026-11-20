'use client';

// ----------------------------------------------------------------------
// SCR-D12 예매 관리 Container — 공연 단계(로딩·오류·공연 없음)와 목록 칸(스켈레톤·오류·결과 0·표) 분기만 한다.
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { ErrorRetry } from '@/src/components/error-retry';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { NoPerformance } from '@/src/sections/reservations/components/no-performance';
import { ReservationEmpty } from '@/src/sections/reservations/components/reservation-empty';
import { ReservationTable } from '@/src/sections/reservations/components/reservation-table';
import { ReservationsView } from '@/src/sections/reservations/view/reservations-view';
import { useReservationsViewModel } from '@/src/sections/reservations/view/use-reservations-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';

interface ReservationsContainerProps {
  /** CLIENT_PUBLIC_URL(서버 page 가 읽어 넘김) — null 이면 초대 링크 복사 비활성 */
  clientPublicUrl: string | null;
}

export function ReservationsContainer({
  clientPublicUrl,
}: ReservationsContainerProps) {
  const vm = useReservationsViewModel(clientPublicUrl);

  let gate = null;
  if (vm.isPerformancesError)
    gate = (
      <ErrorRetry
        message={vm.performancesErrorMessage}
        onRetry={vm.onRetryPerformances}
      />
    );
  else if (vm.hasNoPerformance) gate = <NoPerformance />;
  else if (vm.isPerformancesLoading || !vm.performanceId)
    gate = (
      <Skeleton
        variant='rounded'
        height={320}
        aria-label={MSG_COMMON.LOADING_ARIA}
      />
    );

  let list;
  if (vm.isListLoading) list = <TableSkeleton cardBelow='lg' rows={3} />;
  else if (vm.isListError)
    list = (
      <ErrorRetry message={vm.listErrorMessage} onRetry={vm.onRetryList} />
    );
  else if (vm.rows.length === 0)
    list = (
      <ReservationEmpty hasFilter={vm.hasFilter} onReset={vm.onResetFilters} />
    );
  else
    list = (
      <ReservationTable
        rows={vm.rows}
        matchId={vm.matchId}
        busyId={vm.actions.busyId}
        handlers={{
          ...vm.actions,
          onOpenDetail: vm.onOpenDetail,
          onRequestSeats: vm.seats.onRequestSeats,
        }}
        showSeatColumn={vm.seatSelection}
      />
    );

  return <ReservationsView vm={vm} gate={gate} list={list} />;
}
