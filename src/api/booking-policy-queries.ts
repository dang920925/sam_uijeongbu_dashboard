'use client';

// ----------------------------------------------------------------------
// 예매 설정 쿼리 키와 훅(FN-29). 저장 뒤 ROOT_KEYS.booking 을 무효화한다
// — 회차의 missingFields·state 가 공연 설정에 달려 있어 회차 목록도 함께 다시 불러야 한다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchBookingPolicy,
  saveBookingPolicy,
} from '@/src/api/booking-policy';
import type { BookingPolicyFormInput } from '@/src/api/booking-policy-mapper';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const bookingPolicyKeys = {
  all: ROOT_KEYS.bookingPolicy,
  detail: (performanceId: string) =>
    [...bookingPolicyKeys.all, 'detail', performanceId] as const,
};

export function useBookingPolicy(performanceId: string) {
  return useQuery({
    queryKey: bookingPolicyKeys.detail(performanceId),
    queryFn: () => fetchBookingPolicy(performanceId),
  });
}

export function useSaveBookingPolicy(performanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingPolicyFormInput) =>
      saveBookingPolicy(performanceId, input),
    onSuccess: async (saved) => {
      // 폼이 저장 값으로 바로 돌아가게 먼저 캐시를 채우고, 회차 준비 상태는 다시 불러온다
      queryClient.setQueryData(bookingPolicyKeys.detail(performanceId), saved);
      await queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking });
    },
  });
}
