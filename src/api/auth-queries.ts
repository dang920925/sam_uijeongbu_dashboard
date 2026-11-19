'use client';

// 인증 쿼리·뮤테이션. 로그인 401 은 전역 리다이렉트하지 않고 화면 문구로 보여 준다(B7, meta.suppressGlobalUnauthorized).
import { useMutation } from '@tanstack/react-query';

import { login, logout } from '@/src/api/auth';
import type { LoginRequest } from '@/src/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: LoginRequest) => login(input),
    meta: { suppressGlobalUnauthorized: true },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => logout(),
    meta: { suppressGlobalUnauthorized: true },
  });
}
