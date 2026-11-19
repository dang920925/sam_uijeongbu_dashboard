'use client';

// ----------------------------------------------------------------------
// 일정 쿼리 키와 훅(FN-15). 변경 시 schedule · dashboard(요약 일정 수) 무효화.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROOT_KEYS } from '@/src/api/root-keys';
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  saveSchedule,
} from '@/src/api/schedule';
import type { ScheduleFormInput } from '@/src/api/schedule-mapper';
import type { ScheduleListQuery } from '@/src/types/content';
import { isNotFoundError } from '@/src/utils/api-error-message';

export const scheduleKeys = {
  all: ROOT_KEYS.schedule,
  list: (query: ScheduleListQuery) =>
    [...scheduleKeys.all, 'list', query] as const,
};

export function useSchedules(query: ScheduleListQuery) {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: () => fetchSchedules(query),
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
