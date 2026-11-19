'use client';

// ----------------------------------------------------------------------
// 스낵바 본문(notistack Content) — slate-900 바탕·흰 글자·아이콘 20(성공 emerald·실패 red-300).
// 성공 role="status"(polite) / 실패 role="alert"(designer W3 스낵바 규격).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import { SnackbarContent, type CustomContentProps } from 'notistack';
import { forwardRef } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { SHADOW } from '@/src/theme/layout-tokens';

export const AppSnackbarContent = forwardRef<
  HTMLDivElement,
  CustomContentProps
>(function AppSnackbarContent({ id, message, variant }, ref) {
  const isError = variant === 'error';
  return (
    <SnackbarContent ref={ref} key={id} role={isError ? 'alert' : 'status'}>
      <Box
        aria-live={isError ? 'assertive' : 'polite'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minHeight: 48,
          px: 4,
          py: 3,
          width: { xs: '100%', md: 'auto' },
          borderRadius: 2,
          bgcolor: 'semantic.snackbar.bg',
          color: 'semantic.snackbar.fg',
          boxShadow: SHADOW.snackbar,
        }}
      >
        <Iconify
          icon={
            isError ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'
          }
          size='md'
          sx={{
            color: isError
              ? 'semantic.snackbar.errorIcon'
              : 'semantic.snackbar.successIcon',
          }}
        />
        <Typo.Badge.Medium color='inherit'>{message}</Typo.Badge.Medium>
      </Box>
    </SnackbarContent>
  );
});
