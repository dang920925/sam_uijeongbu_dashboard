'use client';

// ----------------------------------------------------------------------
// 계정 쿼리·뮤테이션(U25, FN-41). 현재 아이디는 `GET /auth/me`(authKeys.me) 를 읽는다.
// 성공하면 me 캐시의 아이디를 바로 바꾸고 무효화한다. 401 은 전역 처리(로그인 이동)를 그대로 둔다
// — 현재 비밀번호 틀림은 400 ACC_001 이라 401 과 겹치지 않는다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { updateAccount } from '@/src/api/account';
import type { AccountFormInput } from '@/src/api/account-mapper';
import { fetchMe } from '@/src/api/auth';
import { authKeys } from '@/src/api/auth-queries';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type { MeResponse } from '@/src/types/auth';

export const accountKeys = {
  all: ROOT_KEYS.account,
};

export function useMe() {
  return useQuery({ queryKey: authKeys.me(), queryFn: fetchMe });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountFormInput) => updateAccount(input),
    onSuccess: ({ username }) => {
      queryClient.setQueryData<MeResponse>(authKeys.me(), (prev) =>
        prev ? { ...prev, username } : prev
      );
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
