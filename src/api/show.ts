// ----------------------------------------------------------------------
// 회차 요청 함수(FN-28) — develop §11.4 `/admin/performances/{id}/shows`(목록 `{ items }`, 날짜·시각 asc)·`/admin/shows/{id}`.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminShowItemResponse,
  toShowUpsertRequest,
  type Show,
  type ShowFormInput,
} from '@/src/api/show-mapper';
import { apiDelete, apiFetch, apiPatch, apiPost } from '@/src/lib/api-client';
import type { AdminShowItemResponse } from '@/src/types/booking';
import type { ItemsResponse } from '@/src/types/common';

export async function fetchPerformanceShows(
  performanceId: string
): Promise<Show[]> {
  const res = await apiFetch<ItemsResponse<AdminShowItemResponse>>(
    endpoints.performances.shows(performanceId)
  );
  return res.items.map(fromAdminShowItemResponse);
}

export async function createShow(
  performanceId: string,
  input: ShowFormInput
): Promise<Show> {
  return fromAdminShowItemResponse(
    await apiPost<AdminShowItemResponse>(
      endpoints.performances.shows(performanceId),
      toShowUpsertRequest(input)
    )
  );
}

export async function saveShow(
  id: string,
  input: ShowFormInput
): Promise<Show> {
  return fromAdminShowItemResponse(
    await apiPatch<AdminShowItemResponse>(
      endpoints.shows.detail(id),
      toShowUpsertRequest(input)
    )
  );
}

/** 예매 중지 스위치 — bookingEnabled 한 칸만 PATCH(develop §11.4 Partial<ShowUpsert>) */
export async function saveShowBookingEnabled(
  id: string,
  bookingEnabled: boolean
): Promise<Show> {
  return fromAdminShowItemResponse(
    await apiPatch<AdminShowItemResponse>(endpoints.shows.detail(id), {
      bookingEnabled,
    })
  );
}

export async function deleteShow(id: string): Promise<void> {
  await apiDelete(endpoints.shows.detail(id));
}
