'use client';

// ----------------------------------------------------------------------
// SCR-D13 입장 체크 Container — 상태 분기만: 회차(오류·로딩·없음) / 명단(로딩·카드·표·다른 회차·검색 0·빈).
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { AdmissionList } from '@/src/sections/admission/components/admission-list';
import { AdmissionNoResult } from '@/src/sections/admission/components/admission-no-result';
import { AdmissionOtherShows } from '@/src/sections/admission/components/admission-other-shows';
import { AdmissionSkeleton } from '@/src/sections/admission/components/admission-skeleton';
import { AdmissionView } from '@/src/sections/admission/view/admission-view';
import { useAdmissionViewModel } from '@/src/sections/admission/view/use-admission-view-model';
import { MSG_D13 } from '@/src/shared/messages/d13';

export function AdmissionContainer() {
  const vm = useAdmissionViewModel();
  let fallback = null;
  if (vm.isShowsError)
    fallback = (
      <ErrorRetry message={vm.showsErrorMessage} onRetry={vm.onRetryShows} />
    );
  else if (vm.isShowsLoading) fallback = <AdmissionSkeleton />;
  else if (!vm.hasShows)
    fallback = (
      <EmptyContent message={MSG_D13.NO_SHOW} icon='solar:calendar-linear' />
    );

  let list = null;
  if (vm.listState === 'loading') list = <AdmissionSkeleton />;
  else if (vm.listState === 'rows')
    list = <AdmissionList {...vm.list} handlers={vm.rowHandlers} />;
  else if (vm.listState === 'other-show')
    list = <AdmissionOtherShows {...vm.otherShow} onMove={vm.onMoveToShow} />;
  else if (vm.listState !== 'error')
    list = (
      <AdmissionNoResult message={vm.emptyMessage} onOnsite={vm.onOpenOnsite} />
    );
  return <AdmissionView vm={vm} showsFallback={fallback} list={list} />;
}
