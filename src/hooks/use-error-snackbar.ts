'use client';

// ----------------------------------------------------------------------
// 조회 오류 스낵바 — 오류가 새로 생길 때 한 번 띄운다(design §3 공통 "오류 = 스낵바 + 목록은 '다시 시도'",
// designer 가 추가한 error·class-error·panel-error 프레임 — qa1 QA1-008). 문구는 화면 오류 상태와 같은 값.
// ----------------------------------------------------------------------
import { useEffect } from 'react';

import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';

export function useErrorSnackbar(message: string | null): void {
  const snackbar = useAppSnackbar();
  useEffect(() => {
    if (message) snackbar.error(message);
  }, [message, snackbar]);
}
