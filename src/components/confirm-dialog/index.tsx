'use client';

// ----------------------------------------------------------------------
// ConfirmDialog — window.confirm 대체(D11). 제목 없이 질문 1줄(= 현행 confirm 문구 그대로) + "취소"·실제 동작.
// - 기본 포커스 "취소"(파괴 동작 실수 방지), Esc·덮개 클릭 = 취소. role="alertdialog".
// - 폭 384, xs 에서도 가운데 카드(designer W3 ConfirmDialog 규격, J-D8).
// - 확인 중 버튼 로딩. 실패 처리(닫고 스낵바)는 호출 쪽 ViewModel 이 한다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { useId } from 'react';

import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel: string;
  confirmColor?: 'error' | 'primary' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel,
  confirmColor = 'error',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const messageId = useId();
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      role='alertdialog'
      aria-labelledby={messageId}
      slotProps={{
        paper: { sx: { width: '100%', maxWidth: LAYOUT.dialogConfirm, m: 4 } },
      }}
    >
      <DialogContent sx={{ px: 6, pt: 6, pb: 2 }}>
        <Typo.Body.Semibold component='p' id={messageId}>
          {message}
        </Typo.Body.Semibold>
      </DialogContent>
      <DialogActions
        sx={{
          p: 6,
          gap: 2,
          '& > :not(style) ~ :not(style)': { ml: 0 },
          '& > .MuiButton-root': { flex: { xs: 1, md: 'none' } },
        }}
      >
        <Button
          variant='outlined'
          color='inherit'
          onClick={onCancel}
          disabled={isLoading}
          autoFocus
        >
          {MSG_COMMON.CANCEL}
        </Button>
        <Button
          variant='contained'
          color={confirmColor}
          onClick={onConfirm}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color='inherit' />
            ) : undefined
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
