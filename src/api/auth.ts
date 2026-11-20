// ----------------------------------------------------------------------
// 인증 요청 함수(FN-08). 로그인·로그아웃은 BFF 라우트가 httpOnly 쿠키를 발급·삭제한다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { apiFetch, apiPost } from '@/src/lib/api-client';
import type { LoginRequest, MeResponse } from '@/src/types/auth';

export async function login(input: LoginRequest): Promise<void> {
  await apiPost<void>(endpoints.auth.login, {
    username: input.username.trim(),
    password: input.password,
  });
}

export async function logout(): Promise<void> {
  await apiPost<void>(endpoints.auth.logout);
}

export function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>(endpoints.auth.me);
}
