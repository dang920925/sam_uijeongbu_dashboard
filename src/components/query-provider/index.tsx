'use client';

// ----------------------------------------------------------------------
// QueryClient + 전역 오류 처리(가이드 A6.4).
// - 401(AUTH_003): BFF 쿠키를 지우고 로그인으로 1회 이동. 로그인 화면 자체의 401 은 meta.suppressGlobalUnauthorized 로 제외(B7).
// - 403: 스낵바(서버 message).
// - 재시도 규칙은 should-retry-query: 4xx·503 COMMON_005(BFF 연결 실패) 없음, 그 밖 5xx·네트워크 1회.
// ----------------------------------------------------------------------
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState, type ReactNode } from 'react';

import { paths } from '@/app/paths';
import { logout } from '@/src/api/auth';
import { shouldRetryQuery } from '@/src/components/query-provider/should-retry-query';
import { ApiError } from '@/src/lib/api-client';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { suppressGlobalUnauthorized?: boolean };
    mutationMeta: {
      suppressGlobalUnauthorized?: boolean;
      suppressGlobalForbidden?: boolean;
    };
  }
}

let isRedirectingToLogin = false;

function redirectToLogin() {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  logout()
    .catch(() => undefined)
    .finally(() => window.location.assign(paths.login));
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [client] = useState(() => {
    const handleError = (
      error: unknown,
      meta?: {
        suppressGlobalUnauthorized?: boolean;
        suppressGlobalForbidden?: boolean;
      }
    ) => {
      if (!(error instanceof ApiError)) return;
      if (error.status === 401 && !meta?.suppressGlobalUnauthorized)
        redirectToLogin();
      if (error.status === 403 && !meta?.suppressGlobalForbidden) {
        enqueueSnackbar(error.message, { variant: 'error' });
      }
    };
    return new QueryClient({
      queryCache: new QueryCache({
        onError: (error, query) => handleError(error, query.meta),
      }),
      mutationCache: new MutationCache({
        onError: (error, _v, _c, mutation) => handleError(error, mutation.meta),
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: shouldRetryQuery,
        },
        mutations: { retry: false },
      },
    });
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
