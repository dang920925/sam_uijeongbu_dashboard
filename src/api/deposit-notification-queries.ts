'use client';

// ----------------------------------------------------------------------
// R2 입금 알림 쿼리·뮤테이션. 연결 확정은 예매를 바꾸므로 ROOT_KEYS.booking 을 통째로 무효화한다
// (예매 목록·집계·받은 금액·입금 알림 목록이 함께 새로 읽힌다). 무시는 입금 알림·받은 금액만 바뀌지만 같은 묶음으로 무효화.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchDepositNotifications,
  fetchDepositReceivedAmounts,
  ignoreDepositNotification,
  matchDepositNotification,
  previewDeposit,
} from '@/src/api/deposit-notification';
import { fetchReservations } from '@/src/api/reservation';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type {
  DepositMatchRequest,
  DepositNotificationListQuery,
  DepositPreviewRequest,
} from '@/src/types/deposit-notification';

export const depositNotificationKeys = {
  all: ROOT_KEYS.depositNotification,
  list: (query: DepositNotificationListQuery) =>
    [...ROOT_KEYS.depositNotification, 'list', query] as const,
  candidates: (code: string) =>
    [...ROOT_KEYS.depositNotification, 'candidates', code] as const,
  receivedAmounts: (performanceId: string) =>
    [...ROOT_KEYS.depositNotification, 'received', performanceId] as const,
};

export function useDepositNotifications(
  query: DepositNotificationListQuery,
  enabled = true
) {
  return useQuery({
    queryKey: depositNotificationKeys.list(query),
    queryFn: () => fetchDepositNotifications(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDepositReceivedAmounts(performanceId: string | null) {
  return useQuery({
    queryKey: depositNotificationKeys.receivedAmounts(performanceId ?? ''),
    queryFn: () => fetchDepositReceivedAmounts(performanceId as string),
    enabled: Boolean(performanceId),
  });
}

/** 예매 연결 다이얼로그 — 예매번호 4자리로 모든 공연의 입금 대기 예매를 찾는다(헤더 빠른 검색과 같은 API) */
export function useDepositCandidateReservations(code: string | null) {
  return useQuery({
    queryKey: depositNotificationKeys.candidates(code ?? ''),
    queryFn: () =>
      fetchReservations({
        q: code as string,
        status: 'PENDING',
        page: 1,
        size: 20,
      }),
    enabled: code !== null,
  });
}

function useInvalidateBooking() {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking });
}

export function usePreviewDeposit() {
  return useMutation({
    mutationFn: (body: DepositPreviewRequest) => previewDeposit(body),
  });
}

export function useMatchDepositNotification() {
  const onSettled = useInvalidateBooking();
  return useMutation({
    mutationFn: (args: { id: string; body: DepositMatchRequest }) =>
      matchDepositNotification(args.id, args.body),
    onSettled,
  });
}

export function useIgnoreDepositNotification() {
  const onSettled = useInvalidateBooking();
  return useMutation({
    mutationFn: (id: string) => ignoreDepositNotification(id),
    onSettled,
  });
}
