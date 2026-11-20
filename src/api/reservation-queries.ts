'use client';

// ----------------------------------------------------------------------
// 예매 쿼리 키와 훅(FN-33·34). 예매를 바꾸면 ROOT_KEYS.booking 을 통째로 무효화한다
// (회차 좌석·집계·입장 명단·초대 집계가 모두 예매 행에서 계산되므로 — root-keys.ts 주석).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelOverdueReservations,
  cancelReservation,
  createManualReservation,
  fetchNearestShowPerformanceId,
  fetchReservationSummary,
  fetchReservations,
  saveReservationItems,
  saveReservationMemo,
  transitionReservation,
  type ReservationTransition,
} from '@/src/api/reservation';
import type {
  ManualReservationFormInput,
  ReservationLinesFormInput,
} from '@/src/api/reservation-mapper';
import { fetchReservationTierOptions } from '@/src/api/reservation-tier-options';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type {
  CancelOverdueRequest,
  CancelReason,
  ReservationListQuery,
} from '@/src/types/booking';

export const reservationKeys = {
  all: ROOT_KEYS.reservation,
  list: (query: ReservationListQuery) =>
    [...reservationKeys.all, 'list', query] as const,
  summary: (performanceId: string) =>
    [...reservationKeys.all, 'summary', performanceId] as const,
  nearestPerformance: () =>
    [...reservationKeys.all, 'nearest-performance'] as const,
  tierOptions: (performanceId: string) =>
    [...ROOT_KEYS.priceTier, 'reservation-options', performanceId] as const,
};

export function useReservations(query: ReservationListQuery, enabled = true) {
  return useQuery({
    queryKey: reservationKeys.list(query),
    queryFn: () => fetchReservations(query),
    enabled: enabled && Boolean(query.performanceId),
    placeholderData: (previous) => previous,
  });
}

export function useReservationSummary(performanceId: string | null) {
  return useQuery({
    queryKey: reservationKeys.summary(performanceId ?? ''),
    queryFn: () => fetchReservationSummary(performanceId as string),
    enabled: Boolean(performanceId),
  });
}

/** D12 기본 공연 — 오늘 이후 첫 회차의 공연(실패해도 첫 공연으로 넘어가게 재시도 없음) */
export function useNearestShowPerformanceId() {
  return useQuery({
    queryKey: reservationKeys.nearestPerformance(),
    queryFn: fetchNearestShowPerformanceId,
    retry: false,
  });
}

export function useReservationTierOptions(performanceId: string | null) {
  return useQuery({
    queryKey: reservationKeys.tierOptions(performanceId ?? ''),
    queryFn: () => fetchReservationTierOptions(performanceId as string),
    enabled: Boolean(performanceId),
  });
}

/** 예매 묶음 전체 무효화(회차 좌석·집계·입장 명단 함께) + (U40) 요약(입금 대기 배지) */
export function useInvalidateBooking() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
    ]);
}

export function useTransitionReservation() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (args: {
      id: string;
      kind: ReservationTransition;
      version: number;
    }) => transitionReservation(args.id, args.kind, args.version),
    onSettled: invalidate,
  });
}

export function useCancelReservation() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (args: { id: string; version: number; reason: CancelReason }) =>
      cancelReservation(args.id, args.version, args.reason),
    onSettled: invalidate,
  });
}

export function useSaveReservationMemo() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (args: { id: string; memo: string; version: number }) =>
      saveReservationMemo(args.id, args.memo, args.version),
    onSettled: invalidate,
  });
}

export function useSaveReservationItems() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (args: {
      id: string;
      input: ReservationLinesFormInput;
      version: number;
    }) => saveReservationItems(args.id, args.input, args.version),
    onSettled: invalidate,
  });
}

export function useCancelOverdueReservations() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (request: CancelOverdueRequest) =>
      cancelOverdueReservations(request),
    onSettled: invalidate,
  });
}

/** 수동 등록(D12 "예매 등록" · D13 "현장 예매 등록" 공용) */
export function useCreateManualReservation() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: ManualReservationFormInput) =>
      createManualReservation(input),
    onSuccess: invalidate,
  });
}
