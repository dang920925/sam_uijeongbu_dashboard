'use client';

// ----------------------------------------------------------------------
// 스낵바 Provider(notistack) — 하단 가운데, 동시에 1개, 성공 4초 / 실패 6초(designer W3 권장).
// ----------------------------------------------------------------------
import { SnackbarProvider } from 'notistack';
import type { ReactNode } from 'react';

import { AppSnackbarContent } from '@/src/components/snackbar/snackbar-content';

interface AppSnackbarProviderProps {
  children: ReactNode;
}

export function AppSnackbarProvider({ children }: AppSnackbarProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={1}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      Components={{ success: AppSnackbarContent, error: AppSnackbarContent }}
    >
      {children}
    </SnackbarProvider>
  );
}
