// ----------------------------------------------------------------------
// 공연·반 요청 함수(FN-09·10) — develop §3.4. 화면 모델 변환은 performance-mapper 에 가둔다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromClassItemResponse,
  fromPerformanceListItemResponse,
  fromPerformanceResponse,
  toClassUpsertRequest,
  toPerformanceUpsertRequest,
} from '@/src/api/performance-mapper';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  withQuery,
} from '@/src/lib/api-client';
import type { ClassStatus } from '@/src/types/codes';
import type { ItemsResponse, Paginated } from '@/src/types/common';
import type {
  ClassFormInput,
  ClassItemResponse,
  PerformanceClass,
} from '@/src/types/performance-class';
import type {
  AdminPerformanceListItemResponse,
  AdminPerformanceResponse,
  Performance,
  PerformanceFormInput,
  PerformanceListQuery,
  PerformanceSummary,
} from '@/src/types/performance';

export async function fetchPerformances(
  query: PerformanceListQuery
): Promise<Paginated<PerformanceSummary>> {
  const res = await apiFetch<Paginated<AdminPerformanceListItemResponse>>(
    withQuery(endpoints.performances.list, query)
  );
  return { ...res, items: res.items.map(fromPerformanceListItemResponse) };
}

export async function fetchPerformance(id: string): Promise<Performance> {
  return fromPerformanceResponse(
    await apiFetch<AdminPerformanceResponse>(endpoints.performances.detail(id))
  );
}

export async function createPerformance(
  input: PerformanceFormInput
): Promise<Performance> {
  return fromPerformanceResponse(
    await apiPost<AdminPerformanceResponse>(
      endpoints.performances.list,
      toPerformanceUpsertRequest(input)
    )
  );
}

export async function savePerformance(
  id: string,
  input: PerformanceFormInput
): Promise<Performance> {
  return fromPerformanceResponse(
    await apiPatch<AdminPerformanceResponse>(
      endpoints.performances.detail(id),
      toPerformanceUpsertRequest(input)
    )
  );
}

export async function deletePerformance(id: string): Promise<void> {
  await apiDelete(endpoints.performances.detail(id));
}

export async function fetchPerformanceClasses(
  performanceId: string
): Promise<PerformanceClass[]> {
  const res = await apiFetch<ItemsResponse<ClassItemResponse>>(
    endpoints.performances.classes(performanceId)
  );
  return res.items.map(fromClassItemResponse);
}

/** 전 공연 반 — 요일·시간 충돌 사전 경고용(develop §3.4 GET /admin/classes) */
export async function fetchAllClasses(
  status?: ClassStatus
): Promise<PerformanceClass[]> {
  const res = await apiFetch<ItemsResponse<ClassItemResponse>>(
    withQuery(endpoints.classes.list, { status })
  );
  return res.items.map(fromClassItemResponse);
}

export async function createClass(
  performanceId: string,
  input: ClassFormInput
): Promise<PerformanceClass> {
  return fromClassItemResponse(
    await apiPost<ClassItemResponse>(
      endpoints.performances.classes(performanceId),
      toClassUpsertRequest(input)
    )
  );
}

export async function saveClass(
  id: string,
  input: ClassFormInput
): Promise<PerformanceClass> {
  return fromClassItemResponse(
    await apiPatch<ClassItemResponse>(
      endpoints.classes.detail(id),
      toClassUpsertRequest(input)
    )
  );
}

export async function deleteClass(id: string): Promise<void> {
  await apiDelete(endpoints.classes.detail(id));
}
