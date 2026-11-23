'use client';

// ----------------------------------------------------------------------
// SCR-D11 회차·예매 설정 View — props 만으로 렌더(가공·API 없음).
// 머리(공연 상세 머리 + 탭 '회차·예매') → 본문: 로딩 스켈레톤 / 오류 "다시 시도" 카드 /
// 준비 상태 알림 → 예매 설정 카드 → 좌석 지정 → 가격 카드(U41 기본가·SAM 관계자가) → 회차 관리 카드.
// + 회차 다이얼로그 · 회차 삭제 확인.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import { PageContainer } from '@/src/components/page-container';
import { SectionStack } from '@/src/components/section-stack';
import { PerformanceDetailHead } from '@/src/sections/performance-detail/components/performance-detail-head';
import { BookingPolicyCard } from '@/src/sections/performance-shows/components/booking-policy-card';
import { InviterPriceCard } from '@/src/sections/performance-shows/components/inviter-price-card';
import { PerformanceShowsSkeleton } from '@/src/sections/performance-shows/components/performance-shows-skeleton';
import { ReadinessNotice } from '@/src/sections/performance-shows/components/readiness-notice';
import { SeatLayoutDialog } from '@/src/sections/performance-shows/components/seat-layout-dialog';
import { SeatSelectionCard } from '@/src/sections/performance-shows/components/seat-selection-card';
import { ShowDialog } from '@/src/sections/performance-shows/components/show-dialog';
import { ShowsCard } from '@/src/sections/performance-shows/components/shows-card';
import type { PerformanceShowsViewModel } from '@/src/sections/performance-shows/view/use-performance-shows-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';

interface PerformanceShowsViewProps {
  performanceId: string;
  vm: PerformanceShowsViewModel;
}

export function PerformanceShowsView({
  performanceId,
  vm,
}: PerformanceShowsViewProps) {
  const body =
    vm.bodyStatus === 'loading' ? (
      <PerformanceShowsSkeleton />
    ) : vm.bodyStatus === 'error' ? (
      <Card>
        <ErrorRetry
          message={vm.bodyErrorMessage ?? ''}
          onRetry={vm.onBodyRetry}
        />
      </Card>
    ) : (
      <>
        {vm.notice ? (
          <ReadinessNotice tone={vm.notice.tone} message={vm.notice.message} />
        ) : null}
        <BookingPolicyCard policyForm={vm.policyForm} />
        <SeatSelectionCard {...vm.seatSelection} />
        <InviterPriceCard priceForm={vm.priceForm} />
        <ShowsCard
          rows={vm.showsSection.rows}
          togglingId={vm.showsSection.togglingId}
          onAdd={vm.showsSection.onAdd}
          onEdit={vm.showsSection.onEdit}
          onDelete={vm.showsSection.onDelete}
          onToggleStop={vm.showsSection.onToggleStop}
          onSeatLayout={vm.showsSection.onSeatLayout}
        />
      </>
    );

  return (
    <PageContainer>
      <SectionStack>
        <PerformanceDetailHead
          performanceId={performanceId}
          title={vm.title ?? <Skeleton variant='text' width={160} />}
          current='shows'
        />
        {body}
      </SectionStack>
      <ShowDialog dialog={vm.showDialog} classOptions={vm.classOptions} />
      <SeatLayoutDialog {...vm.seatLayout} />
      <ConfirmDialog
        open={vm.deleteConfirm.isOpen}
        message={MSG_D11.DELETE_CONFIRM}
        description={vm.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.deleteConfirm.isDeleting}
        onConfirm={vm.deleteConfirm.onConfirm}
        onCancel={vm.deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
