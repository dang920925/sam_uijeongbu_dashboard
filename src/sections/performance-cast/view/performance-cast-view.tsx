'use client';

// ----------------------------------------------------------------------
// SCR-D14 배역·캐스팅 View(R3 — design §6 SCR-D14 · §12) — props 만으로 렌더(가공·API 없음).
// 머리(공연 상세 머리 + 탭 '배역·캐스팅' + (U48) 홈페이지 미리보기) → 본문: 로딩 / 오류 "다시 시도" / 공개 스위치 → 배역 →
// 팀 구성(U45) → 캐스트 사진(U48) → 회차별 캐스팅 → 참여자.
// + 배역 다이얼로그 · 배우 고르기 · 참여자 다이얼로그 · 배역/참여자 삭제 확인.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import { PageContainer } from '@/src/components/page-container';
import { SectionStack } from '@/src/components/section-stack';
import { HomepagePreviewButton } from '@/src/sections/performance-detail/components/homepage-preview-button';
import { PerformanceDetailHead } from '@/src/sections/performance-detail/components/performance-detail-head';
import { ActorPickerDialog } from '@/src/sections/performance-cast/components/actor-picker-dialog';
import { CastCreditsCard } from '@/src/sections/performance-cast/components/cast-credits-card';
import { CastGridCard } from '@/src/sections/performance-cast/components/cast-grid-card';
import { CastPhotosCard } from '@/src/sections/performance-cast/components/cast-photos-card';
import { CastPublicCard } from '@/src/sections/performance-cast/components/cast-public-card';
import { CastRolesCard } from '@/src/sections/performance-cast/components/cast-roles-card';
import { CastTeamsCard } from '@/src/sections/performance-cast/components/cast-teams-card';
import { CreditDialog } from '@/src/sections/performance-cast/components/credit-dialog';
import { RoleDialog } from '@/src/sections/performance-cast/components/role-dialog';
import type { PerformanceCastViewModel } from '@/src/sections/performance-cast/view/use-performance-cast-view-model';
import { PerformanceShowsSkeleton } from '@/src/sections/performance-shows/components/performance-shows-skeleton';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface PerformanceCastViewProps {
  performanceId: string;
  vm: PerformanceCastViewModel;
}

export function PerformanceCastView({
  performanceId,
  vm,
}: PerformanceCastViewProps) {
  const credits = vm.creditSection;
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
        <CastPublicCard
          checked={vm.publicSwitch.checked}
          isSaving={vm.publicSwitch.isSaving}
          onChange={vm.publicSwitch.onChange}
        />
        <CastRolesCard {...vm.roleSection} />
        <CastTeamsCard section={vm.teamSection} />
        <CastPhotosCard
          section={vm.photoSection}
          isPublic={vm.publicSwitch.checked}
          homepageUrl={vm.homepageCastUrl}
        />
        <CastGridCard
          grid={vm.grid}
          onEditCell={vm.grid.onEditCell}
          onClearCell={vm.grid.onClearCell}
        />
        <CastCreditsCard
          rows={credits.rows}
          onAdd={credits.onAdd}
          onEdit={credits.onEdit}
          onDelete={credits.deleteConfirm.onRequest}
          onMove={credits.onMove}
          onToggleVisible={credits.onToggleVisible}
        />
      </>
    );

  return (
    <PageContainer>
      <SectionStack>
        <PerformanceDetailHead
          performanceId={performanceId}
          title={vm.title ?? <Skeleton variant='text' width={160} />}
          current='cast'
          actions={<HomepagePreviewButton preview={vm.preview} />}
        />
        {body}
      </SectionStack>
      <RoleDialog dialog={vm.roleDialog} />
      <ActorPickerDialog picker={vm.picker} />
      <CreditDialog dialog={credits.dialog} />
      <ConfirmDialog
        open={vm.roleDeleteConfirm.isOpen}
        message={MSG_D14.ROLE_DELETE_CONFIRM(vm.roleDeleteConfirm.label)}
        description={MSG_D14.ROLE_DELETE_DESC}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.roleDeleteConfirm.isDeleting}
        onConfirm={vm.roleDeleteConfirm.onConfirm}
        onCancel={vm.roleDeleteConfirm.onCancel}
      />
      <ConfirmDialog
        open={vm.photoSection.deleteConfirm.isOpen}
        message={vm.photoSection.deleteConfirm.message}
        description={vm.photoSection.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.photoSection.deleteConfirm.isDeleting}
        onConfirm={vm.photoSection.deleteConfirm.onConfirm}
        onCancel={vm.photoSection.deleteConfirm.onCancel}
      />
      <ConfirmDialog
        open={credits.deleteConfirm.isOpen}
        message={MSG_D14.CREDIT_DELETE_CONFIRM(credits.deleteConfirm.title)}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={credits.deleteConfirm.isDeleting}
        onConfirm={credits.deleteConfirm.onConfirm}
        onCancel={credits.deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
