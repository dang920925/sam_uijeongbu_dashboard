'use client';

// ----------------------------------------------------------------------
// 일정 쿼리 키와 훅(FN-15). 변경 시 schedule · dashboard(요약 일정 수) 무효화.
// ----------------------------------------------------------------------
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { ROOT_KEYS } from '@/src/api/root-keys';
import {
  cancelSchedule,
  createSchedule,
  deleteSchedule,
  fetchScheduleCancelImpact,
  fetchScheduleMonth,
  fetchSchedules,
  restoreSchedule,
  saveSchedule,
} from '@/src/api/schedule';
import type { ScheduleFormInput } from '@/src/api/schedule-mapper';
import type { ScheduleType } from '@/src/types/codes';
import type { Schedule, ScheduleListQuery } from '@/src/types/content';
import { isNotFoundError } from '@/src/utils/api-error-message';

export const scheduleKeys = {
  all: ROOT_KEYS.schedule,
  list: (query: ScheduleListQuery) =>
    [...scheduleKeys.all, 'list', query] as const,
  /** 달 단위 캐시(J-59) — ROOT_KEYS.schedule 아래라 저장·삭제·취소 뒤 함께 무효화된다(U-8) */
  month: (year: number, month: number, type?: ScheduleType) =>
    [...scheduleKeys.all, 'month', { year, month, type }] as const,
  cancelImpact: (id: string) =>
    [...scheduleKeys.all, 'cancel-impact', id] as const,
};

export interface YearMonth {
  year: number;
  month: number;
}

/**
 * 보이는 범위가 걸치는 달들(최대 3)을 달마다 한 번씩 받는다(J-59).
 * 이전 범위 데이터를 지우지 않도록 각 달은 placeholderData 로 직전 값을 유지한다(깜빡임 방지).
 */
export function useScheduleMonths(months: YearMonth[], type?: ScheduleType) {
  return useQueries({
    queries: months.map(({ year, month }) => ({
      queryKey: scheduleKeys.month(year, month, type),
      queryFn: () => fetchScheduleMonth({ year, month, type }),
      placeholderData: (previous: Schedule[] | undefined) => previous,
    })),
    combine: (results) => ({
      items: results.flatMap((r) => r.data ?? []),
      isPending: results.some((r) => r.isPending),
      isFetching: results.some((r) => r.isFetching),
      isError: results.some((r) => r.isError),
      error: results.find((r) => r.error)?.error ?? null,
      refetch: () => Promise.all(results.map((r) => r.refetch())),
    }),
  });
}

/** 취소 창을 열 때만 받는다(id 가 null 이면 꺼짐) */
export function useScheduleCancelImpact(id: string | null) {
  return useQuery({
    queryKey: scheduleKeys.cancelImpact(id ?? ''),
    queryFn: () => fetchScheduleCancelImpact(id as string),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

/** enabled=false 면 받지 않는다(월·주 보기에서 목록 쿼리를 멈춤 — W1 요청) */
export function useSchedules(query: ScheduleListQuery, enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: () => fetchSchedules(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

function useInvalidateSchedules() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.schedule }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
    ]);
}

export function useCreateSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (input: ScheduleFormInput) => createSchedule(input),
    onSuccess: invalidate,
  });
}

export function useSaveSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleFormInput }) =>
      saveSchedule(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
    // 이미 지워진 항목(404)이면 문구는 스낵바로 그대로 두고 목록을 다시 불러와 행을 없앤다(qa1 QA1-012)
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}

/**
 * 취소·해제 뒤에는 신청서(D06 '일정 취소됨')도 바뀌므로 application 까지 무효화한다.
 * 409(SCH_003·SCH_004 — 다른 곳에서 먼저 바뀜)면 목록을 다시 받아 실제 상태로 맞춘다(design §8).
 */
function useInvalidateAfterCancel() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.schedule }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.application }),
    ]);
}

export function useCancelSchedule() {
  const invalidate = useInvalidateAfterCancel();
  return useMutation({
    mutationFn: ({
      schedule,
      input,
    }: {
      schedule: Pick<Schedule, 'id' | 'type'>;
      input: { reason: string; observationClosed: boolean };
    }) => cancelSchedule(schedule, input),
    onSuccess: invalidate,
    onError: () => void invalidate(),
  });
}

export function useRestoreSchedule() {
  const invalidate = useInvalidateAfterCancel();
  return useMutation({
    mutationFn: (id: string) => restoreSchedule(id),
    onSuccess: invalidate,
    onError: () => void invalidate(),
  });
}
