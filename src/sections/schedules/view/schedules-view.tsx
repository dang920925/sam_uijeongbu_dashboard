'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 View — props 만으로 그린다. 목록 칸(표·스켈레톤·빈·오류)은 Container 가 골라 list 로 준다.
// 순서(design SCR-D08): 머리 + "일정 추가" → 타입 필터 pill → 카드(표/카드 리스트) → 페이지네이션.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { SectionStack } from '@/src/components/section-stack';
import { SegmentPill } from '@/src/components/segment-pill';
import { ScheduleFormDialog } from '@/src/sections/schedules/components/schedule-form-dialog';
import type { SchedulesViewModel } from '@/src/sections/schedules/view/use-schedules-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface SchedulesViewProps {
  vm: SchedulesViewModel;
  list: ReactNode;
}

export function SchedulesView({ vm, list }: SchedulesViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D08.TITLE}
          subtitle={MSG_D08.SUBTITLE}
          actions={
            <Button
              variant='contained'
              startIcon={<Iconify icon='solar:add-circle-linear' />}
              onClick={vm.onOpenAdd}
            >
              {MSG_D08.ADD}
            </Button>
          }
        />
        <SegmentPill
          ariaLabel={MSG_D08.COL_TYPE}
          options={vm.filterOptions}
          value={vm.typeFilter}
          onChange={vm.onFilterChange}
        />
        <div className='flex flex-col gap-4'>
          <Card>{list}</Card>
          <Pagination
            page={vm.page}
            totalPages={vm.totalPages}
            onChange={vm.onPageChange}
          />
        </div>
      </SectionStack>
      <ScheduleFormDialog
        open={vm.isDialogOpen}
        title={vm.dialogTitle}
        submitLabel={vm.submitLabel}
        form={vm.form}
        errors={vm.errors}
        submitError={vm.submitError}
        isSubmitting={vm.isSubmitting}
        typeOptions={vm.typeOptions}
        performanceOptions={vm.performanceOptions}
        classOptions={vm.classOptions}
        onFieldChange={vm.onFieldChange}
        onSubmit={vm.onSubmit}
        onClose={vm.onCloseDialog}
      />
      <ConfirmDialog
        open={vm.isDeleteOpen}
        message={MSG_D08.CONFIRM_DELETE}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.isDeleting}
        onConfirm={vm.onConfirmDelete}
        onCancel={vm.onCancelDelete}
      />
    </PageContainer>
  );
}
