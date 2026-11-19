'use client';

// ----------------------------------------------------------------------
// 공연 관리(SCR-D03) 페이지 틀 — 머리("공연 관리"/부제 + "공연 추가") · 목록 카드 · 추가 다이얼로그.
// 로딩·빈·오류·기본 상태가 모두 같은 카드 안에 그려진다(designer D03 프레임).
// 다이얼로그는 리드 공용 PerformanceFormDialog(mode=create, 초기값 EMPTY_PERFORMANCE_FORM).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PerformanceFormDialog } from '@/src/components/performance-form-dialog';
import { EMPTY_PERFORMANCE_FORM } from '@/src/components/performance-form-dialog/validate-performance-form';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { MSG_D03 } from '@/src/shared/messages/d03';
import type { PerformanceFormInput } from '@/src/types/performance';

interface CreateDialogProps {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: PerformanceFormInput) => void;
  onClose: () => void;
}

interface PerformanceListPageShellProps {
  onAdd: () => void;
  dialog: CreateDialogProps;
  children: ReactNode;
}

export function PerformanceListPageShell({
  onAdd,
  dialog,
  children,
}: PerformanceListPageShellProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D03.TITLE}
          subtitle={MSG_D03.SUBTITLE}
          actions={
            <Button
              variant='contained'
              onClick={onAdd}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D03.ADD}
            </Button>
          }
        />
        <Card>{children}</Card>
      </SectionStack>
      <PerformanceFormDialog
        open={dialog.open}
        mode='create'
        initialValue={EMPTY_PERFORMANCE_FORM}
        isSubmitting={dialog.isSubmitting}
        errorMessage={dialog.errorMessage}
        onSubmit={dialog.onSubmit}
        onClose={dialog.onClose}
      />
    </PageContainer>
  );
}
