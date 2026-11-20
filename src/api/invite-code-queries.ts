'use client';

// 초대 링크 쿼리 키와 훅(FN-35). 발급·재발급 뒤 inviteCode 루트를 무효화한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchInviteCodes, issueInviteCode } from '@/src/api/invite-code';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const inviteCodeKeys = {
  all: ROOT_KEYS.inviteCode,
  list: () => [...inviteCodeKeys.all, 'list'] as const,
};

export function useInviteCodes() {
  return useQuery({
    queryKey: inviteCodeKeys.list(),
    queryFn: fetchInviteCodes,
  });
}

export function useIssueInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => issueInviteCode(memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inviteCodeKeys.all }),
  });
}
