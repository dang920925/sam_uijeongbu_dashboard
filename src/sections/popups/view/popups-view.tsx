'use client';

// ----------------------------------------------------------------------
// 팝업 관리(SCR-D10) View — 머리("팝업 추가") → 표 카드(content, 상태는 Container 가 고름) + 다이얼로그·삭제 확인.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import type { PopupFormInput } from '@/src/api/popup-mapper';
import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { PopupFormDialog } from '@/src/sections/popups/components/popup-form-dialog';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D10 } from '@/src/shared/messages/d10';

interface PopupsViewProps {
  content: ReactNode;
  onAdd: () => void;
  dialog: {
    open: boolean;
    mode: 'create' | 'edit';
    initialValue: PopupFormInput;
    isSubmitting: boolean;
    errorMessage: string | null;
    checkOverlap: (input: PopupFormInput) => boolean;
    onSubmit: (input: PopupFormInput) => void;
    onClose: () => void;
  };
  deleteConfirm: {
    open: boolean;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };
}

export function PopupsView({
  content,
  onAdd,
  dialog,
  deleteConfirm,
}: PopupsViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D10.TITLE}
          subtitle={MSG_D10.SUBTITLE}
          actions={
            <Button
              variant='contained'
              onClick={onAdd}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D10.ADD}
            </Button>
          }
        />
        <Card>{content}</Card>
      </SectionStack>
      <PopupFormDialog {...dialog} />
      <ConfirmDialog
        {...deleteConfirm}
        message={MSG_D10.DELETE_CONFIRM}
        confirmLabel={MSG_COMMON.DELETE}
      />
    </PageContainer>
  );
}
