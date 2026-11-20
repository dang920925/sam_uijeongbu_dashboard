'use client';

// ----------------------------------------------------------------------
// 연출진 관리(SCR-D09) View — 머리("연출진 추가") → 표 카드(content, 상태는 Container 가 고름) + 다이얼로그·삭제 확인.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import type { StaffFormInput } from '@/src/api/staff-mapper';
import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { StaffFormDialog } from '@/src/sections/staff/components/staff-form-dialog';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D09 } from '@/src/shared/messages/d09';

interface StaffViewProps {
  content: ReactNode;
  onAdd: () => void;
  dialog: {
    open: boolean;
    mode: 'create' | 'edit';
    initialValue: StaffFormInput;
    isSubmitting: boolean;
    errorMessage: string | null;
    onSubmit: (input: StaffFormInput) => void;
    onClose: () => void;
  };
  deleteConfirm: {
    open: boolean;
    message: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };
}

export function StaffView({
  content,
  onAdd,
  dialog,
  deleteConfirm,
}: StaffViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D09.TITLE}
          subtitle={MSG_D09.SUBTITLE}
          actions={
            <Button
              variant='contained'
              onClick={onAdd}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D09.ADD}
            </Button>
          }
        />
        <Card>{content}</Card>
      </SectionStack>
      <StaffFormDialog {...dialog} />
      <ConfirmDialog {...deleteConfirm} confirmLabel={MSG_COMMON.DELETE} />
    </PageContainer>
  );
}
