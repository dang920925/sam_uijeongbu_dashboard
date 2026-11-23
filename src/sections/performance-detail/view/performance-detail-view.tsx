'use client';

// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리 View — props 만으로 렌더(가공·API 없음).
// 머리(← "공연 관리로 돌아가기" + h1 공연명 + "공연 상세 정보" + 탭 — R1) → 공연 정보 카드 → 반 관리 카드
// + 공연 수정(공용 PerformanceFormDialog edit) · 반 다이얼로그 · 반 삭제 확인 · (U47) 맨 아래 공연 삭제(위험) 카드.
// ----------------------------------------------------------------------
import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PerformanceFormDialog } from '@/src/components/performance-form-dialog';
import { SectionStack } from '@/src/components/section-stack';
import { PerformanceDeleteCard } from '@/src/sections/performance-detail/components/performance-delete-card';
import { HomepagePreviewButton } from '@/src/sections/performance-detail/components/homepage-preview-button';
import { PerformanceDetailHead } from '@/src/sections/performance-detail/components/performance-detail-head';
import { PerformanceDetailClassCard } from '@/src/sections/performance-detail/components/performance-detail-class-card';
import { PerformanceDetailClassDialog } from '@/src/sections/performance-detail/components/performance-detail-class-dialog';
import { PerformanceDetailInfoCard } from '@/src/sections/performance-detail/components/performance-detail-info-card';
import type { PerformanceInfoDisplay } from '@/src/sections/performance-detail/utils/performance-detail-display';
import type { PerformanceDetailViewModel } from '@/src/sections/performance-detail/view/use-performance-detail-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';

interface PerformanceDetailViewProps {
  performanceId: string;
  info: PerformanceInfoDisplay;
  classSection: PerformanceDetailViewModel['classSection'];
  classDialog: PerformanceDetailViewModel['classDialog'];
  editDialog: PerformanceDetailViewModel['editDialog'];
  deleteConfirm: PerformanceDetailViewModel['deleteConfirm'];
  performanceDelete: PerformanceDetailViewModel['performanceDelete'];
  preview: PerformanceDetailViewModel['preview'];
}

export function PerformanceDetailView({
  performanceId,
  info,
  classSection,
  classDialog,
  editDialog,
  deleteConfirm,
  performanceDelete,
  preview,
}: PerformanceDetailViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PerformanceDetailHead
          performanceId={performanceId}
          title={info.title}
          current='info'
          actions={<HomepagePreviewButton preview={preview} />}
        />
        <PerformanceDetailInfoCard info={info} onEdit={editDialog.onOpen} />
        <PerformanceDetailClassCard
          isLoading={classSection.isLoading}
          errorMessage={classSection.errorMessage}
          rows={classSection.rows}
          onRetry={classSection.onRetry}
          onAdd={classSection.onAdd}
          onEdit={classSection.onEdit}
          onDelete={classSection.onDelete}
        />
        <PerformanceDeleteCard state={performanceDelete} />
      </SectionStack>
      {editDialog.initialValue ? (
        <PerformanceFormDialog
          open={editDialog.isOpen}
          mode='edit'
          initialValue={editDialog.initialValue}
          isSubmitting={editDialog.isSubmitting}
          errorMessage={editDialog.errorMessage}
          onSubmit={editDialog.onSubmit}
          onClose={editDialog.onClose}
        />
      ) : null}
      <PerformanceDetailClassDialog dialog={classDialog} />
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        message={MSG_D04.CLASS_DELETE_CONFIRM}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={deleteConfirm.isDeleting}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
