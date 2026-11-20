// ----------------------------------------------------------------------
// 신청 목록 필터·정렬(U31 보강 — develop §15.5 · design §10.1) — 순수 함수.
// - 유형 pill(전체/참관/상담) · 처리 상태 · 작품 · 연락(전체/연락 전/연락 완료) · 진행 / 정렬(접수일·진행·연락 시각, asc/desc).
// - 필터 → `ApplicationListQuery`: '전체'는 보내지 않고, 연락은 boolean(쿼리 'true'|'false'), 정렬은 늘 보낸다(기본 createdAt desc).
// - 진행 필터 항목: 유형을 고르면 그 유형 단계·이름, 전체면 다섯 단계에 두 유형 이름을 "·"로 묶는다(designer §18.3 확인 필요 ③ — 자체 결정).
// - 정렬 머리 누르기: 같은 열이면 방향만 뒤집고, 다른 열이면 그 열 내림차순부터.
// ----------------------------------------------------------------------
import type { ApplicationListQuery } from '@/src/types/application';
import {
  APPLICATION_PROGRESSES,
  APPLICATION_PROGRESSES_BY_TYPE,
  APPLICATION_PROGRESS_LABEL,
  type ApplicationProgress,
  type ApplicationSort,
  type ApplicationStatus,
  type ApplicationType,
  type SortOrder,
} from '@/src/types/codes';

export const ALL = 'ALL' as const;
export type AppTypeFilter = ApplicationType | typeof ALL;
export type StatusFilter = ApplicationStatus | typeof ALL;
export type ContactFilter = 'UNCONTACTED' | 'CONTACTED' | typeof ALL;
export type ProgressFilter = ApplicationProgress | typeof ALL;

export interface ApplicationFilters {
  appType: AppTypeFilter;
  status: StatusFilter;
  /** 작품 id 또는 ALL */
  performanceId: string;
  contact: ContactFilter;
  progress: ProgressFilter;
  sort: ApplicationSort;
  order: SortOrder;
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = {
  appType: ALL,
  status: ALL,
  performanceId: ALL,
  contact: ALL,
  progress: ALL,
  sort: 'createdAt',
  order: 'desc',
};

export function toApplicationListQuery(
  filters: ApplicationFilters,
  page: number,
  size: number
): ApplicationListQuery {
  return {
    appType: filters.appType === ALL ? undefined : filters.appType,
    status: filters.status === ALL ? undefined : filters.status,
    performanceId:
      filters.performanceId === ALL ? undefined : filters.performanceId,
    contacted:
      filters.contact === ALL ? undefined : filters.contact === 'CONTACTED',
    progress: filters.progress === ALL ? undefined : filters.progress,
    sort: filters.sort,
    order: filters.order,
    page,
    size,
  };
}

/** 정렬 외 필터가 하나라도 걸려 있는지(빈 문구 고르기) */
export function hasActiveFilter(filters: ApplicationFilters): boolean {
  return (
    filters.status !== ALL ||
    filters.performanceId !== ALL ||
    filters.contact !== ALL ||
    filters.progress !== ALL
  );
}

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

/** 진행 필터 항목(맨 앞 '전체'는 화면이 붙인다) */
export function toProgressFilterOptions(
  appType: AppTypeFilter
): FilterOption<ApplicationProgress>[] {
  if (appType !== ALL)
    return APPLICATION_PROGRESSES_BY_TYPE[appType].map((value) => ({
      value,
      label: APPLICATION_PROGRESS_LABEL[appType][value],
    }));
  const types: ApplicationType[] = ['WORK_OBSERVATION', 'CONSULTATION'];
  return APPLICATION_PROGRESSES.map((value) => {
    // 그 단계를 쓰는 유형의 이름만(참관에 없는 JOINED 는 상담 이름만), 같은 이름은 한 번
    const names = new Set(
      types
        .filter((type) => APPLICATION_PROGRESSES_BY_TYPE[type].includes(value))
        .map((type) => APPLICATION_PROGRESS_LABEL[type][value])
    );
    return { value, label: [...names].join('·') };
  });
}

/** 유형을 바꿀 때 — 새 유형에 없는 진행 단계면 '전체'로, 쪽은 1로 */
export function changeAppType(
  filters: ApplicationFilters,
  appType: AppTypeFilter
): ApplicationFilters {
  const allowed =
    filters.progress === ALL ||
    toProgressFilterOptions(appType).some((o) => o.value === filters.progress);
  return { ...filters, appType, progress: allowed ? filters.progress : ALL };
}

/** 정렬 머리 누르기 */
export function nextSort(
  filters: ApplicationFilters,
  sort: ApplicationSort
): ApplicationFilters {
  if (filters.sort === sort)
    return { ...filters, order: filters.order === 'desc' ? 'asc' : 'desc' };
  return { ...filters, sort, order: 'desc' };
}

/** 표 머리 aria-sort 값 */
export function toAriaSort(
  filters: ApplicationFilters,
  sort: ApplicationSort
): 'ascending' | 'descending' | 'none' {
  if (filters.sort !== sort) return 'none';
  return filters.order === 'asc' ? 'ascending' : 'descending';
}

/** 작품 필터 항목 — 제목순(designer §17.4 ① "제목순 전체 가정") */
export function toWorkFilterOptions(
  performances: { id: string; title: string }[]
): FilterOption<string>[] {
  return [...performances]
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    .map((p) => ({ value: p.id, label: p.title }));
}
