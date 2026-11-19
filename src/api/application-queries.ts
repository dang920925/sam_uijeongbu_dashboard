'use client';

// ----------------------------------------------------------------------
// 신청서 쿼리 키와 훅(FN-13). 승인·거절·단원으로 등록 성공 시
// application(목록·대기 건수·상세) · member(단원 목록) · dashboard(요약 대기 건수) 를 함께 무효화한다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveApplication,
  fetchApplication,
  fetchApplications,
  fetchPendingApplicationCount,
  registerMemberFromApplication,
  rejectApplication,
} from '@/src/api/application';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type { ApplicationListQuery } from '@/src/types/application';
import type { ApplicationType } from '@/src/types/codes';
import type { MemberFormInput } from '@/src/types/member';

export const applicationKeys = {
  all: ROOT_KEYS.application,
  list: (query: ApplicationListQuery) =>
    [...applicationKeys.all, 'list', query] as const,
  pendingCount: (appType?: ApplicationType) =>
    [...applicationKeys.all, 'pending-count', appType] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
};

export function useApplications(query: ApplicationListQuery) {
  return useQuery({
    queryKey: applicationKeys.list(query),
    queryFn: () => fetchApplications(query),
    placeholderData: (previous) => previous,
  });
}

export function usePendingApplicationCount(appType?: ApplicationType) {
  return useQuery({
    queryKey: applicationKeys.pendingCount(appType),
    queryFn: () => fetchPendingApplicationCount(appType),
  });
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => fetchApplication(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.application }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.member }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
    ]);
}

export function useApproveApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: string) => approveApplication(id),
    onSuccess: invalidate,
  });
}

export function useRejectApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: string) => rejectApplication(id),
    onSuccess: invalidate,
  });
}

export function useRegisterMemberFromApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemberFormInput }) =>
      registerMemberFromApplication(id, input),
    onSuccess: invalidate,
  });
}
