'use client';

// 단원·배우 프로필 쿼리 키와 훅. 변경 시 member·dashboard(등록 배우 수) 무효화.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createMember,
  deleteMember,
  fetchActorProfile,
  fetchMember,
  fetchMembers,
  saveActorProfile,
  saveMember,
} from '@/src/api/member';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type {
  ActorProfile,
  MemberFormInput,
  MemberListQuery,
  MemberUpdateRequest,
} from '@/src/types/member';
import { isNotFoundError } from '@/src/utils/api-error-message';

export const memberKeys = {
  all: ROOT_KEYS.member,
  list: (query: MemberListQuery) => [...memberKeys.all, 'list', query] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
  actorProfile: (id: string) =>
    [...memberKeys.all, 'actor-profile', id] as const,
};

export function useMembers(query: MemberListQuery) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => fetchMembers(query),
    placeholderData: (previous) => previous,
  });
}

export function useMember(id: string | null) {
  return useQuery({
    queryKey: memberKeys.detail(id ?? ''),
    queryFn: () => fetchMember(id as string),
    enabled: Boolean(id),
  });
}

export function useActorProfile(memberId: string | null) {
  return useQuery({
    queryKey: memberKeys.actorProfile(memberId ?? ''),
    queryFn: () => fetchActorProfile(memberId as string),
    enabled: Boolean(memberId),
  });
}

function useInvalidateMembers() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.member }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
    ]);
}

export function useCreateMember() {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: (input: MemberFormInput) => createMember(input),
    onSuccess: invalidate,
  });
}

export function useSaveMember() {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemberUpdateRequest }) =>
      saveMember(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () =>
      Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ROOT_KEYS.application }),
      ]),
    // 이미 지워진 항목(404)이면 문구는 스낵바로 그대로 두고 목록을 다시 불러와 행을 없앤다(qa1 QA1-012)
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}

export function useSaveActorProfile() {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: (profile: ActorProfile) => saveActorProfile(profile),
    onSuccess: invalidate,
  });
}
