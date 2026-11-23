'use client';

// ----------------------------------------------------------------------
// 회차 쿼리 키와 훅(FN-28). 변경 뒤 ROOT_KEYS.booking 을 무효화한다
// — 회차가 바뀌면 예매 설정의 준비 상태·예매 집계·입장 회차 목록도 함께 바뀐다(root-keys.ts 주석).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROOT_KEYS } from '@/src/api/root-keys';
import {
  createShow,
  deleteShow,
  fetchPerformanceShows,
  saveShow,
  saveShowBookingEnabled,
  saveShowTeam,
} from '@/src/api/show';
import type { ShowFormInput } from '@/src/api/show-mapper';
import { isNotFoundError } from '@/src/utils/api-error-message';

export const showKeys = {
  all: ROOT_KEYS.show,
  list: (performanceId: string) =>
    [...showKeys.all, 'list', performanceId] as const,
};

export function usePerformanceShows(performanceId: string) {
  return useQuery({
    queryKey: showKeys.list(performanceId),
    queryFn: () => fetchPerformanceShows(performanceId),
  });
}

function useInvalidateBooking() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking });
}

export function useCreateShow(performanceId: string) {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: ShowFormInput) => createShow(performanceId, input),
    onSuccess: invalidate,
  });
}

export function useSaveShow() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ShowFormInput }) =>
      saveShow(id, input),
    onSuccess: invalidate,
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}

export function useSaveShowBookingEnabled() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      id,
      bookingEnabled,
    }: {
      id: string;
      bookingEnabled: boolean;
    }) => saveShowBookingEnabled(id, bookingEnabled),
    // 실패해도 목록을 다시 불러와 스위치를 서버 값으로 되돌린다
    onSettled: invalidate,
  });
}

/** (U48) 회차 출연 팀 — 실패해도 목록을 다시 받아 선택을 서버 값으로 되돌린다 */
export function useSaveShowTeam() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      id,
      teamAccountId,
    }: {
      id: string;
      teamAccountId: string | null;
    }) => saveShowTeam(id, teamAccountId),
    onSettled: invalidate,
  });
}

export function useDeleteShow() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (id: string) => deleteShow(id),
    onSuccess: invalidate,
    // 이미 지워진 회차(404 SHW_001)면 문구는 스낵바로 두고 목록을 다시 불러와 행을 없앤다(D09 qa1 QA1-012 와 같음)
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}
