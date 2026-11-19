'use client';

// ----------------------------------------------------------------------
// AdminDialog — 대시보드 폼 다이얼로그 틀(MUI Dialog). 포커스 가둠·Esc 닫기는 MUI 기본.
// - 폭 512, 이미지 업로드가 있는 폼은 wide 640(designer.md §2.5).
// - xs(768 미만)는 전체 화면, 본문 스크롤(max-height 100vh-32).
// - 제출 실패 문구는 다이얼로그 안(errorMessage) — 입력을 잃지 않게(designer W3 스낵바 규격).
// ----------------------------------------------------------------------
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { FormEvent, ReactNode } from 'react';
import { useId } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface AdminDialogProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  /** form submit — Enter 제출을 위해 form 으로 감싼다 */
  onSubmit?: () => void;
  actions: ReactNode;
  children: ReactNode;
  wide?: boolean;
  errorMessage?: string | null;
  /** 진행 중에는 바깥 클릭·Esc 로 닫히지 않게 */
  isBusy?: boolean;
}

export function AdminDialog({
  open,
  title,
  onClose,
  onSubmit,
  actions,
  children,
  wide = false,
  errorMessage,
  isBusy = false,
}: AdminDialogProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('md'));
  const titleId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      fullScreen={isXs}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          noValidate: true,
          sx: {
            width: '100%',
            maxWidth: wide ? LAYOUT.dialogWide : LAYOUT.dialog,
            m: { xs: 0, md: 4 },
          },
        } as object,
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          px: { xs: 4, md: 6 },
          pt: { xs: 4, md: 6 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Typo.Title.Bold component='span'>{title}</Typo.Title.Bold>
        {/* 시안 오른쪽 위 닫기(X) — designer .dialog__title, aria-label 은 현행 sr-only "닫기" */}
        <IconButton
          aria-label={MSG_COMMON.CLOSE}
          onClick={onClose}
          disabled={isBusy}
          sx={{ mr: -2, color: 'text.secondary' }}
        >
          <Iconify icon='solar:close-circle-linear' size='md' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 4, md: 6 } }}>
        <div className='flex flex-col gap-4 pt-1'>
          {children}
          {errorMessage ? (
            <Alert
              severity='error'
              icon={<Iconify icon='solar:danger-circle-linear' />}
              sx={{
                bgcolor: 'semantic.alert.errorBg',
                color: 'error.main',
                border: 1,
                borderColor: 'semantic.alert.errorBorder',
              }}
            >
              <Typo.Caption.Regular color='inherit' role='alert'>
                {errorMessage}
              </Typo.Caption.Regular>
            </Alert>
          ) : null}
        </div>
      </DialogContent>
      <DialogActions
        sx={{
          p: { xs: 4, md: 6 },
          gap: 2,
          '& > :not(style) ~ :not(style)': { ml: 0 },
          '& > .MuiButton-root': { flex: { xs: 1, md: 'none' } },
        }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
}
