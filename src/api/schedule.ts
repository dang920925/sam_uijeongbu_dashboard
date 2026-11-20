// ----------------------------------------------------------------------
// 일정 요청 함수(FN-15) — develop §3.4 "일정". 목록은 startAt desc 페이지.
// 수정(PATCH)도 폼 전 필드를 보낸다 — 지운 장소·설명·연결 칸을 null 로 되돌리기 위해.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromScheduleItemResponse,
  toScheduleCancelRequest,
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
import type { ScheduleType } from '@/src/types/codes';
import type { Paginated } from '@/src/types/common';
import type {
  Schedule,
  ScheduleCancelImpact,
  ScheduleCancelImpactResponse,
  ScheduleItemResponse,
  ScheduleListQuery,
} from '@/src/types/content';

/** 달 조회 한 쪽 크기 — 서버 상한(develop FN-15 U23) */
export const SCHEDULE_MONTH_PAGE_SIZE = 100;

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

/**
 * 한 달(KST) 일정 전부 — year·month 를 항상 함께 보내고, totalPages > 1 이면 나머지 쪽을 이어 받아 합친다
 * (develop FN-15 U23 2·J-24, 보강 J-59 — 달 단위 조회).
 */
export async function fetchScheduleMonth(params: {
  year: number;
  month: number;
  type?: ScheduleType;
}): Promise<Schedule[]> {
  const query = { ...params, size: SCHEDULE_MONTH_PAGE_SIZE };
  const first = await fetchSchedules({ ...query, page: 1 });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      fetchSchedules({ ...query, page: i + 2 })
    )
  );
  return [first, ...rest].flatMap((page) => page.items);
}

/** U29 — 취소 영향(그 날·그 공연 참관 신청) */
export async function fetchScheduleCancelImpact(
  id: string
): Promise<ScheduleCancelImpact> {
  const res = await apiFetch<ScheduleCancelImpactResponse>(
    endpoints.schedules.cancelImpact(id)
  );
  return {
    observationApplications: {
      count: res.observationApplications.count,
      items: res.observationApplications.items.map((item) => ({ ...item })),
    },
  };
}

/** U29 — 일정 취소(이미 취소 409 SCH_003) */
export async function cancelSchedule(
  schedule: Pick<Schedule, 'id' | 'type'>,
  input: { reason: string; observationClosed: boolean }
): Promise<Schedule> {
  return fromScheduleItemResponse(
    await apiPost<ScheduleItemResponse>(
      endpoints.schedules.cancel(schedule.id),
      toScheduleCancelRequest({ ...input, type: schedule.type })
    )
  );
}

/** U29 — 취소 해제(취소 아님 409 SCH_004) */
export async function restoreSchedule(id: string): Promise<Schedule> {
  return fromScheduleItemResponse(
    await apiPost<ScheduleItemResponse>(endpoints.schedules.restore(id))
  );
}
