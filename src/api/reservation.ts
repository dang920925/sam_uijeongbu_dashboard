// ----------------------------------------------------------------------
// 예매 요청 함수(FN-33·34) — develop §11.4 `/admin/reservations`.
// (리드가 수동 등록을 먼저 만들고, D12 작업자가 목록·집계·전이·메모·일괄 취소를 이어서 더한다.)
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminReservationItemResponse,
  toManualReservationRequest,
  toReservationItemsRequest,
  type ManualReservationFormInput,
  type Reservation,
  type ReservationLinesFormInput,
} from '@/src/api/reservation-mapper';
import {
  apiFetch,
  apiPatch,
  apiPost,
  apiPut,
  withQuery,
} from '@/src/lib/api-client';
import type {
  AdminReservationItemResponse,
  AdminShowWithTitleResponse,
  CancelOverdueRequest,
  CancelOverdueResponse,
  CancelReason,
  ReservationListQuery,
  ReservationSummaryBoardResponse,
} from '@/src/types/booking';
import type { ItemsResponse, Paginated } from '@/src/types/common';
import { todayKst } from '@/src/utils/kst-date-format';

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

/** 예매 목록(D12 — 공연 안, 접수 desc) */
export async function fetchReservations(
  query: ReservationListQuery
): Promise<Paginated<Reservation>> {
  const res = await apiFetch<Paginated<AdminReservationItemResponse>>(
    withQuery(endpoints.reservations.list, query)
  );
  return { ...res, items: res.items.map(fromAdminReservationItemResponse) };
}

/** 집계(KPI·회차별·등급별·단원별) */
export function fetchReservationSummary(
  performanceId: string
): Promise<ReservationSummaryBoardResponse> {
  return apiFetch<ReservationSummaryBoardResponse>(
    withQuery(endpoints.reservations.summary, { performanceId })
  );
}

/**
 * D12 기본 공연(지휘자 결정 2026-11-20) — `GET /admin/shows?from=오늘` 첫 회차의 performanceId.
 * 응답에 performanceId 가 없거나(계약 밖 필드) 회차가 없으면 null(화면은 첫 공연을 고른다).
 */
export async function fetchNearestShowPerformanceId(): Promise<string | null> {
  const res = await apiFetch<ItemsResponse<AdminShowWithTitleResponse>>(
    withQuery(endpoints.shows.list, { from: todayKst() })
  );
  return res.items.find((item) => item.performanceId)?.performanceId ?? null;
}

export type ReservationTransition = 'confirm' | 'unconfirm' | 'restore';

/** 상태 전이(입금 확인 · 확인 취소 · 되살리기) — version 확인(RSV_007), 잘못된 전이 RSV_008 */
export async function transitionReservation(
  id: string,
  kind: ReservationTransition,
  version: number
): Promise<Reservation> {
  return fromAdminReservationItemResponse(
    await apiPost<AdminReservationItemResponse>(
      endpoints.reservations[kind](id),
      { version }
    )
  );
}

export async function cancelReservation(
  id: string,
  version: number,
  reason: CancelReason
): Promise<Reservation> {
  return fromAdminReservationItemResponse(
    await apiPost<AdminReservationItemResponse>(
      endpoints.reservations.cancel(id),
      { version, reason }
    )
  );
}

/** 메모(빈 문자열 → null) */
export async function saveReservationMemo(
  id: string,
  memo: string,
  version: number
): Promise<Reservation> {
  const trimmed = memo.trim();
  return fromAdminReservationItemResponse(
    await apiPatch<AdminReservationItemResponse>(
      endpoints.reservations.detail(id),
      { memo: trimmed === '' ? null : trimmed, version }
    )
  );
}

/** 등급 수정 — 줄 통째 교체(같은 등급 줄은 예매 당시 가격 유지 J-77), 상태는 그대로 */
export async function saveReservationItems(
  id: string,
  input: ReservationLinesFormInput,
  version: number
): Promise<Reservation> {
  return fromAdminReservationItemResponse(
    await apiPut<AdminReservationItemResponse>(
      endpoints.reservations.items(id),
      toReservationItemsRequest(input, version)
    )
  );
}

/** 기한 지난 입금 대기 일괄 취소(reason DEADLINE_PASSED) */
export async function cancelOverdueReservations(
  request: CancelOverdueRequest
): Promise<number> {
  const res = await apiPost<CancelOverdueResponse>(
    endpoints.reservations.cancelOverdue,
    request
  );
  return res.cancelledCount;
}
