'use client';

// ----------------------------------------------------------------------
// 스낵바 호출 훅 — ViewModel 이 성공·실패 문구를 띄운다. 문구는 messages 상수 또는 서버 message(한국어).
// ----------------------------------------------------------------------
import { useSnackbar } from 'notistack';
import { useMemo } from 'react';

export interface AppSnackbar {
  success: (message: string) => void;
  error: (message: string) => void;
}

export function useAppSnackbar(): AppSnackbar {
  const { enqueueSnackbar } = useSnackbar();
  return useMemo(
    () => ({
      success: (message: string) =>
        enqueueSnackbar(message, { variant: 'success' }),
      error: (message: string) =>
        enqueueSnackbar(message, { variant: 'error', autoHideDuration: 6000 }),
    }),
    [enqueueSnackbar]
  );
}
