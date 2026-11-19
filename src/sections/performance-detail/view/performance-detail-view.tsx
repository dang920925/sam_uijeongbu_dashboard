'use client';

// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리 View — props 만으로 렌더(가공·API 없음).
// 머리(← "공연 관리로 돌아가기" + h1 공연명 + "공연 상세 정보") → 공연 정보 카드 → 반 관리 카드
// + 공연 수정(공용 PerformanceFormDialog edit) · 반 다이얼로그 · 반 삭제 확인.
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';

import { paths } from '@/app/paths';
import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { PerformanceFormDialog } from '@/src/components/performance-form-dialog';
import { SectionStack } from '@/src/components/section-stack';
import { PerformanceDetailClassCard } from '@/src/sections/performance-detail/components/performance-detail-class-card';
import { PerformanceDetailClassDialog } from '@/src/sections/performance-detail/components/performance-detail-class-dialog';
import { PerformanceDetailInfoCard } from '@/src/sections/performance-detail/components/performance-detail-info-card';
import type { PerformanceInfoDisplay } from '@/src/sections/performance-detail/utils/performance-detail-display';
import type { PerformanceDetailViewModel } from '@/src/sections/performance-detail/view/use-performance-detail-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PerformanceDetailViewProps {
  info: PerformanceInfoDisplay;
  classSection: PerformanceDetailViewModel['classSection'];
  classDialog: PerformanceDetailViewModel['classDialog'];
  editDialog: PerformanceDetailViewModel['editDialog'];
  deleteConfirm: PerformanceDetailViewModel['deleteConfirm'];
}

export function PerformanceDetailView({
  info,
  classSection,
  classDialog,
  editDialog,
  deleteConfirm,
}: PerformanceDetailViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          leading={
            <IconButton
              component={Link}
              href={paths.performances.root}
              aria-label={MSG_D04.BACK}
              sx={{ width: LAYOUT.control, height: LAYOUT.control }}
            >
              <Iconify icon='solar:arrow-left-linear' size='md' />
            </IconButton>
          }
          title={info.title}
          subtitle={MSG_D04.SUBTITLE}
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
