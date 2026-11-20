// ----------------------------------------------------------------------
// 일정 요청 함수(FN-15) — develop §3.4 "일정". 목록은 startAt desc 페이지.
// 수정(PATCH)도 폼 전 필드를 보낸다 — 지운 장소·설명·연결 칸을 null 로 되돌리기 위해.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromScheduleItemResponse,
  toScheduleUpsertRequest,
  type ScheduleFormInput,
} from '@/src/api/schedule-mapper';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  withQuery,
} from '@/src/lib/api-client';
import type { Paginated } from '@/src/types/common';
import type {
  Schedule,
  ScheduleItemResponse,
  ScheduleListQuery,
} from '@/src/types/content';

export async function fetchSchedules(
  query: ScheduleListQuery
): Promise<Paginated<Schedule>> {
  const res = await apiFetch<Paginated<ScheduleItemResponse>>(
    withQuery(endpoints.schedules.list, query)
  );
  return { ...res, items: res.items.map(fromScheduleItemResponse) };
}

export async function createSchedule(
  input: ScheduleFormInput
): Promise<Schedule> {
  return fromScheduleItemResponse(
    await apiPost<ScheduleItemResponse>(
      endpoints.schedules.list,
      toScheduleUpsertRequest(input)
    )
  );
}

export async function saveSchedule(
  id: string,
  input: ScheduleFormInput
): Promise<Schedule> {
  return fromScheduleItemResponse(
    await apiPatch<ScheduleItemResponse>(
      endpoints.schedules.detail(id),
      toScheduleUpsertRequest(input)
    )
  );
}

export async function deleteSchedule(id: string): Promise<void> {
  await apiDelete(endpoints.schedules.detail(id));
}
