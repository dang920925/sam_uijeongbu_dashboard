// ----------------------------------------------------------------------
// 좌석 요청 함수(U35 — develop §19.2 · back-end §16).
// - 배치·현황 GET: 배치가 없으면 404 SEAT_003 → null(편집기는 새 배치로 시작).
// - 배치 저장 PUT(통째 교체) · 다른 회차에서 복사 POST · 예매 좌석 변경 PUT { seatIds, version }.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminSeatMapResponse,
  type AdminSeatMap,
} from '@/src/api/seat-map-mapper';
import {
  fromAdminReservationItemResponse,
  type Reservation,
} from '@/src/api/reservation-mapper';
import {
  ApiError,
  apiFetch,
  apiPatch,
  apiPost,
  apiPut,
} from '@/src/lib/api-client';
import type {
  AdminReservationItemResponse,
  AdminSeatMapResponse,
  SaveSeatMapRequest,
} from '@/src/types/booking';

/** 배치 없음(404 SEAT_003)인가 */
export function isNoSeatLayoutError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    error.code === 'SEAT_003'
  );
}

export async function fetchAdminSeatMap(
  showId: string
): Promise<AdminSeatMap | null> {
  try {
    return fromAdminSeatMapResponse(
      await apiFetch<AdminSeatMapResponse>(endpoints.shows.seatMap(showId))
    );
  } catch (error) {
    if (isNoSeatLayoutError(error)) return null;
    throw error;
  }
}

export async function saveSeatMap(
  showId: string,
  body: SaveSeatMapRequest
): Promise<AdminSeatMap> {
  return fromAdminSeatMapResponse(
    await apiPut<AdminSeatMapResponse>(endpoints.shows.seatMap(showId), body)
  );
}

export async function copySeatMap(
  showId: string,
  sourceShowId: string
): Promise<AdminSeatMap> {
  return fromAdminSeatMapResponse(
    await apiPost<AdminSeatMapResponse>(endpoints.shows.seatMapCopy(showId), {
      sourceShowId,
    })
  );
}

export async function replaceReservationSeats(
  id: string,
  seatIds: string[],
  version: number
): Promise<Reservation> {
  return fromAdminReservationItemResponse(
    await apiPut<AdminReservationItemResponse>(
      endpoints.reservations.seats(id),
      { seatIds, version }
    )
  );
}

/** 공연 좌석 지정 스위치(PATCH 부분 수정 — 다른 필드는 보내지 않는다) */
export async function saveSeatSelectionEnabled(
  performanceId: string,
  enabled: boolean
): Promise<void> {
  await apiPatch(endpoints.performances.detail(performanceId), {
    seatSelectionEnabled: enabled,
  });
}
