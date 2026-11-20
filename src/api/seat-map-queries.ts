'use client';

// ----------------------------------------------------------------------
// 좌석 쿼리 키와 훅(U35). 좌석 지도는 예매 묶음(ROOT_KEYS.booking) 아래 — 예매·좌석을 바꾸면 함께 무효화한다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROOT_KEYS } from '@/src/api/root-keys';
import {
  copySeatMap,
  fetchAdminSeatMap,
  replaceReservationSeats,
  saveSeatMap,
  saveSeatSelectionEnabled,
} from '@/src/api/seat-map';
import type { SaveSeatMapRequest } from '@/src/types/booking';

export const seatMapKeys = {
  all: [...ROOT_KEYS.booking, 'seat-map'] as const,
  show: (showId: string) => [...seatMapKeys.all, showId] as const,
};

/** 회차 좌석 지도(배치 없으면 data = null). showId 가 없으면 부르지 않는다 */
export function useAdminSeatMap(showId: string | null) {
  return useQuery({
    queryKey: seatMapKeys.show(showId ?? ''),
    queryFn: () => fetchAdminSeatMap(showId ?? ''),
    enabled: Boolean(showId),
    staleTime: 0,
  });
}

function useInvalidateBooking() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking });
}

export function useSaveSeatMap() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      showId,
      body,
    }: {
      showId: string;
      body: SaveSeatMapRequest;
    }) => saveSeatMap(showId, body),
    onSuccess: invalidate,
  });
}

export function useCopySeatMap() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      showId,
      sourceShowId,
    }: {
      showId: string;
      sourceShowId: string;
    }) => copySeatMap(showId, sourceShowId),
    onSuccess: invalidate,
  });
}

export function useReplaceReservationSeats() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      id,
      seatIds,
      version,
    }: {
      id: string;
      seatIds: string[];
      version: number;
    }) => replaceReservationSeats(id, seatIds, version),
    // 409(SEAT_001·RSV_007)도 지도·목록을 새로 받는다
    onSettled: invalidate,
  });
}

/** 공연 좌석 지정 스위치 — 공연·예매 묶음을 함께 무효화(회차 준비 상태가 바뀐다) */
export function useSaveSeatSelectionEnabled(performanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      saveSeatSelectionEnabled(performanceId, enabled),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ROOT_KEYS.performance }),
        queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking }),
      ]),
  });
}
