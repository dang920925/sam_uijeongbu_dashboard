'use client';

// ----------------------------------------------------------------------
// 배역·캐스팅·참여자 쿼리 키와 훅(R3). 변경은 모두 ROOT_KEYS.cast 를 무효화한다 — 배역·격자·참여자·배우 쪽
// SAM 출연작이 같은 행을 보므로 한 번에 다시 받는다(배우 단원 프로필이 새로 생기면 단원 목록도).
// 공개 스위치는 공연 상세(castPublic)와 publicNow 가 함께 바뀐다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addMemberCast,
  addMemberCredit,
  clearShowCast,
  createCredit,
  createRole,
  deleteCredit,
  deleteRole,
  fetchCredits,
  fetchMemberSamCredits,
  fetchRoles,
  fetchShowCastGrid,
  patchCredit,
  patchRole,
  removeMemberCast,
  reorderCredits,
  reorderRoles,
  replaceDefaultCast,
  replaceShowCast,
  saveCastPublic,
} from '@/src/api/cast';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type {
  CastActorRequest,
  CreditCreateRequest,
  CreditPatchRequest,
  MemberCastCreateRequest,
  MemberCreditCreateRequest,
  RoleCreateRequest,
  RolePatchRequest,
} from '@/src/types/cast';

export const castKeys = {
  all: ROOT_KEYS.cast,
  roles: (performanceId: string) =>
    [...castKeys.all, 'roles', performanceId] as const,
  grid: (performanceId: string) =>
    [...castKeys.all, 'grid', performanceId] as const,
  credits: (performanceId: string) =>
    [...castKeys.all, 'credits', performanceId] as const,
  member: (memberId: string) => [...castKeys.all, 'member', memberId] as const,
};

export function useRoles(performanceId: string) {
  return useQuery({
    queryKey: castKeys.roles(performanceId),
    queryFn: () => fetchRoles(performanceId),
  });
}

export function useShowCastGrid(performanceId: string) {
  return useQuery({
    queryKey: castKeys.grid(performanceId),
    queryFn: () => fetchShowCastGrid(performanceId),
  });
}

export function useCredits(performanceId: string) {
  return useQuery({
    queryKey: castKeys.credits(performanceId),
    queryFn: () => fetchCredits(performanceId),
  });
}

export function useMemberSamCredits(memberId: string | null) {
  return useQuery({
    queryKey: castKeys.member(memberId ?? ''),
    queryFn: () => fetchMemberSamCredits(memberId as string),
    enabled: memberId !== null,
  });
}

/** 배우 쪽에서 고를 작품의 배역(작품을 고르기 전엔 쉼) */
export function useRolesOf(performanceId: string | null) {
  return useQuery({
    queryKey: castKeys.roles(performanceId ?? ''),
    queryFn: () => fetchRoles(performanceId as string),
    enabled: performanceId !== null,
  });
}

function useInvalidateCast() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.cast }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.member }),
    ]);
}

export function useCreateRole(performanceId: string) {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (body: RoleCreateRequest) => createRole(performanceId, body),
    onSuccess: invalidate,
  });
}

export function usePatchRole() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RolePatchRequest }) =>
      patchRole(id, body),
    onSettled: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSettled: invalidate,
  });
}

export function useReorderRoles(performanceId: string) {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (roleIds: string[]) => reorderRoles(performanceId, roleIds),
    onSettled: invalidate,
  });
}

export function useReplaceDefaultCast() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({
      roleId,
      actors,
    }: {
      roleId: string;
      actors: CastActorRequest[];
    }) => replaceDefaultCast(roleId, actors),
    onSettled: invalidate,
  });
}

export function useReplaceShowCast() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({
      showId,
      roleId,
      actors,
    }: {
      showId: string;
      roleId: string;
      actors: CastActorRequest[];
    }) => replaceShowCast(showId, roleId, actors),
    onSuccess: invalidate,
  });
}

export function useClearShowCast() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({ showId, roleId }: { showId: string; roleId: string }) =>
      clearShowCast(showId, roleId),
    onSettled: invalidate,
  });
}

export function useCreateCredit(performanceId: string) {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (body: CreditCreateRequest) =>
      createCredit(performanceId, body),
    onSuccess: invalidate,
  });
}

export function usePatchCredit() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreditPatchRequest }) =>
      patchCredit(id, body),
    onSettled: invalidate,
  });
}

export function useDeleteCredit() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (id: string) => deleteCredit(id),
    onSettled: invalidate,
  });
}

export function useReorderCredits(performanceId: string) {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (creditIds: string[]) =>
      reorderCredits(performanceId, creditIds),
    onSettled: invalidate,
  });
}

/** 배우 추가(배역 선택 사항 — 비우면 "출연" 묶음). D14 "배우 추가"·"출연자 추가"와 D05 "SAM 출연작 추가" 공용 */
export function useAddMemberCast() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: MemberCastCreateRequest;
    }) => addMemberCast(memberId, body),
    onSuccess: invalidate,
  });
}

export function useRemoveMemberCast() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      removeMemberCast(memberId, roleId),
    onSettled: invalidate,
  });
}

export function useAddMemberCredit() {
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: MemberCreditCreateRequest;
    }) => addMemberCredit(memberId, body),
    onSuccess: invalidate,
  });
}

export function useSaveCastPublic(performanceId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCast();
  return useMutation({
    mutationFn: (castPublic: boolean) =>
      saveCastPublic(performanceId, castPublic),
    onSettled: () =>
      Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ROOT_KEYS.performance }),
      ]),
  });
}
