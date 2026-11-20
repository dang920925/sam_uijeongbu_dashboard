// ----------------------------------------------------------------------
// 예매 요청 함수(FN-33·34) — develop §11.4 `/admin/reservations`.
// (리드가 수동 등록을 먼저 만들고, D12 작업자가 목록·집계·전이·메모·일괄 취소를 이어서 더한다.)
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminReservationItemResponse,
  toManualReservationRequest,
  type ManualReservationFormInput,
  type Reservation,
} from '@/src/api/reservation-mapper';
import { apiFetch, apiPost, withQuery } from '@/src/lib/api-client';
import type {
  AdminReservationItemResponse,
  ReservationListQuery,
} from '@/src/types/booking';
import type { Paginated } from '@/src/types/common';

/** 수동 등록(D12 "예매 등록" · D13 "현장 예매 등록") — confirmNow·admitNow 면 한 번에 확정+입장(S16) */
export async function createManualReservation(
  input: ManualReservationFormInput
): Promise<Reservation> {
  return fromAdminReservationItemResponse(
    await apiPost<AdminReservationItemResponse>(
      endpoints.reservations.list,
      toManualReservationRequest(input)
    )
  );
}

/**
 * 공연을 가로지르는 검색(지휘자 추가 요청 2026-11-20 "예매번호로 찾기") — `GET /admin/reservations?q=` 를
 * performanceId 없이 부른다. 헤더 빠른 검색·입장 체크 "다른 회차 예매" 안내가 쓴다.
 */
export async function searchReservations(
  q: string,
  query: Omit<ReservationListQuery, 'q' | 'performanceId'> = {}
): Promise<Reservation[]> {
  const res = await apiFetch<Paginated<AdminReservationItemResponse>>(
    withQuery(endpoints.reservations.list, {
      ...query,
      q,
      size: query.size ?? 20,
    })
  );
  return res.items.map(fromAdminReservationItemResponse);
}
