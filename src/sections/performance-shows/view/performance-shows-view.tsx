'use client';

// ----------------------------------------------------------------------
// SCR-D11 회차·예매 설정 View — props 만으로 렌더(가공·API 없음).
// 머리(공연 상세 머리 + 탭 '회차·예매') → 본문: 로딩 스켈레톤 / 오류 "다시 시도" 카드 /
// 준비 상태 알림 → 예매 설정 카드 → 가격 등급 카드 → 회차 관리 카드.
// + 회차 다이얼로그 · 회차 삭제 확인 · 등급 다이얼로그 · 단원 고르기 · 링크 재발급 확인 · 등급 삭제 확인.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import { PageContainer } from '@/src/components/page-container';
import { SectionStack } from '@/src/components/section-stack';
import { PerformanceDetailHead } from '@/src/sections/performance-detail/components/performance-detail-head';
import { BookingPolicyCard } from '@/src/sections/performance-shows/components/booking-policy-card';
import { PerformanceShowsSkeleton } from '@/src/sections/performance-shows/components/performance-shows-skeleton';
import { ReadinessNotice } from '@/src/sections/performance-shows/components/readiness-notice';
import { ShowDialog } from '@/src/sections/performance-shows/components/show-dialog';
import { ShowsCard } from '@/src/sections/performance-shows/components/shows-card';
import { TierCard } from '@/src/sections/performance-shows/components/tier-card';
import { TierDialog } from '@/src/sections/performance-shows/components/tier-dialog';
import { TierMemberLinkDialog } from '@/src/sections/performance-shows/components/tier-member-link-dialog';
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
        <TierCard card={vm.tierSection.card} />
        <ShowsCard
          rows={vm.showsSection.rows}
          togglingId={vm.showsSection.togglingId}
          onAdd={vm.showsSection.onAdd}
          onEdit={vm.showsSection.onEdit}
          onDelete={vm.showsSection.onDelete}
          onToggleStop={vm.showsSection.onToggleStop}
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
      <ConfirmDialog
        open={vm.deleteConfirm.isOpen}
        message={MSG_D11.DELETE_CONFIRM}
        description={vm.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.deleteConfirm.isDeleting}
        onConfirm={vm.deleteConfirm.onConfirm}
        onCancel={vm.deleteConfirm.onCancel}
      />
      <TierDialog dialog={vm.tierSection.dialog} />
      <TierMemberLinkDialog state={vm.tierSection.memberLink} />
      <ConfirmDialog
        open={vm.tierSection.reissueConfirm.isOpen}
        message={MSG_D11.REISSUE_CONFIRM}
        description={vm.tierSection.reissueConfirm.description}
        confirmLabel={MSG_D11.REISSUE}
        confirmColor='primary'
        isLoading={vm.tierSection.reissueConfirm.isLoading}
        onConfirm={vm.tierSection.reissueConfirm.onConfirm}
        onCancel={vm.tierSection.reissueConfirm.onCancel}
      />
      <ConfirmDialog
        open={vm.tierSection.deleteConfirm.isOpen}
        message={MSG_D11.TIER_DELETE_CONFIRM}
        description={vm.tierSection.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.tierSection.deleteConfirm.isLoading}
        onConfirm={vm.tierSection.deleteConfirm.onConfirm}
        onCancel={vm.tierSection.deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
