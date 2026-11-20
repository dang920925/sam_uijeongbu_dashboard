'use client';

// ----------------------------------------------------------------------
// 입금 확인 스낵바 + "되돌리기" 액션(designer snackbar-confirmed · `.d12-snack-action`, 6초 — designer §5 충돌 5).
// 공용 AppSnackbarContent 는 액션 자리가 없어 화면 전용으로 같은 모양을 그린다(리드 공용 승격 후보).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { SHADOW } from '@/src/theme/layout-tokens';

interface UndoSnackbarProps {
  /** 방금 입금 확인한 예매번호 — null 이면 닫힘 */
  code: string | null;
  onUndo: () => void;
  onClose: () => void;
}

const UNDO_DURATION_MS = 6000;

export function UndoSnackbar({ code, onUndo, onClose }: UndoSnackbarProps) {
  return (
    <Snackbar
      open={code !== null}
      autoHideDuration={UNDO_DURATION_MS}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Box
        role='status'
        aria-live='polite'
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minHeight: 48,
          pl: 4,
          pr: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: 'semantic.snackbar.bg',
          color: 'semantic.snackbar.fg',
          boxShadow: SHADOW.snackbar,
        }}
      >
        <Iconify
          icon='solar:check-circle-linear'
          size='md'
          sx={{ color: 'semantic.snackbar.successIcon' }}
        />
        <Typo.Badge.Medium color='inherit'>
          {code ? MSG_D12.CONFIRMED(code) : ''}
        </Typo.Badge.Medium>
        <Button
          onClick={onUndo}
          sx={{ color: 'inherit', minHeight: 44, textDecoration: 'underline' }}
        >
          {MSG_D12.UNDO}
        </Button>
      </Box>
    </Snackbar>
  );
}
