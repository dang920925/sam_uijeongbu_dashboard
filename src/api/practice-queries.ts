'use client';

// ----------------------------------------------------------------------
// 팀 계정·연습실 예약(관리) 쿼리 키와 훅(U34). 비밀번호는 화면에만 머물게 캐시를 오래 두지 않는다(gcTime 짧게).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addTeamMember,
  createRoomBlock,
  createTeamAccount,
  deleteRoomBlock,
  deleteAdminRoomReservation,
  fetchAdminRoomReservations,
  fetchRoomBlockConflicts,
  fetchRoomBlocks,
  fetchTeamAccounts,
  fetchTeamRoster,
  removeTeamMember,
  resetTeamPassword,
  setTeamAccountActive,
  skipRoomBlockDate,
  updateRoomBlock,
  updateTeamPrefix,
} from '@/src/api/practice';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type { RoomBlockRequest } from '@/src/types/practice';

export const teamAccountKeys = {
  all: ROOT_KEYS.teamAccount,
  list: (performanceId: string) =>
    [...teamAccountKeys.all, 'list', performanceId] as const,
};

export const teamRosterKeys = {
  all: [...ROOT_KEYS.teamAccount, 'roster'] as const,
  detail: (performanceId: string) =>
    [...teamRosterKeys.all, performanceId] as const,
};

export const roomBlockKeys = {
  all: ROOT_KEYS.roomBlock,
};

export const roomReservationKeys = {
  all: ROOT_KEYS.roomReservation,
  range: (from: string, to: string) =>
    [...roomReservationKeys.all, from, to] as const,
};

/** 비밀번호가 담긴 응답 — 화면을 떠나면 1분 안에 캐시에서 지운다 */
const PASSWORD_GC_MS = 60_000;

export function useTeamAccounts(performanceId: string) {
  return useQuery({
    queryKey: teamAccountKeys.list(performanceId),
    queryFn: () => fetchTeamAccounts(performanceId),
    gcTime: PASSWORD_GC_MS,
  });
}

function useInvalidateTeams() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: teamAccountKeys.all });
}

export function useCreateTeamAccount(performanceId: string) {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: () => createTeamAccount(performanceId),
    onSettled: invalidate,
  });
}

export function useUpdateTeamPrefix(performanceId: string) {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (prefix: string) => updateTeamPrefix(performanceId, prefix),
    onSettled: invalidate,
  });
}

export function useResetTeamPassword() {
  const invalidate = useInvalidateTeams();
  return useMutation({ mutationFn: resetTeamPassword, onSettled: invalidate });
}

export function useSetTeamAccountActive() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setTeamAccountActive(id, isActive),
    onSettled: invalidate,
  });
}

export function useAdminRoomReservations(
  range: { from: string; to: string },
  enabled = true
) {
  return useQuery({
    enabled,
    queryKey: roomReservationKeys.range(range.from, range.to),
    queryFn: () => fetchAdminRoomReservations(range),
  });
}

export function useDeleteAdminRoomReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminRoomReservation,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: roomReservationKeys.all }),
  });
}

/** (U45) 팀 구성 표 */
export function useTeamRoster(performanceId: string) {
  return useQuery({
    queryKey: teamRosterKeys.detail(performanceId),
    queryFn: () => fetchTeamRoster(performanceId),
  });
}

/** (U45) 팀 소속 배우 넣기·빼기 — 한 칸씩 */
export function useToggleTeamMember(performanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamAccountId,
      memberId,
      checked,
    }: {
      teamAccountId: string;
      memberId: string;
      checked: boolean;
    }) =>
      checked
        ? addTeamMember(teamAccountId, memberId)
        : removeTeamMember(teamAccountId, memberId),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: teamRosterKeys.detail(performanceId),
      }),
  });
}

/** (U46) 막은 시간 목록 */
export function useRoomBlocks() {
  return useQuery({ queryKey: roomBlockKeys.all, queryFn: fetchRoomBlocks });
}

/** (U46) 막은 시간이 바뀌면 규칙 목록과 연습실 일정(예약·발생분)을 함께 다시 받는다 */
function useInvalidateRoomSchedule() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: roomBlockKeys.all }),
      queryClient.invalidateQueries({ queryKey: roomReservationKeys.all }),
    ]);
}

export function useSaveRoomBlock() {
  const invalidate = useInvalidateRoomSchedule();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string | null;
      body: RoomBlockRequest;
    }) => (id ? updateRoomBlock(id, body) : createRoomBlock(body)),
    onSettled: invalidate,
  });
}

export function useDeleteRoomBlock() {
  const invalidate = useInvalidateRoomSchedule();
  return useMutation({ mutationFn: deleteRoomBlock, onSettled: invalidate });
}

export function useSkipRoomBlockDate() {
  const invalidate = useInvalidateRoomSchedule();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      skipRoomBlockDate(id, date),
    onSettled: invalidate,
  });
}

/** (U46) 저장 전 겹치는 팀 예약 조회(읽기지만 본문이 있어 mutation 으로 부른다 — 캐시하지 않음) */
export function useRoomBlockConflicts() {
  return useMutation({ mutationFn: fetchRoomBlockConflicts });
}
