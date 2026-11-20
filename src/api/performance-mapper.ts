// ----------------------------------------------------------------------
// 공연·반 매퍼(FN-09·10) — 서버 계약(camelCase) ↔ 화면 모델·폼 입력. 순수 함수(+ spec).
// 폼의 빈 문자열은 계약의 null 로(develop §3.1 "값 없음은 null").
// ----------------------------------------------------------------------
import type {
  ClassFormInput,
  ClassItemResponse,
  ClassUpsertRequest,
  PerformanceClass,
} from '@/src/types/performance-class';
import type {
  AdminPerformanceListItemResponse,
  AdminPerformanceResponse,
  Performance,
  PerformanceFormInput,
  PerformanceSummary,
  PerformanceUpsertRequest,
} from '@/src/types/performance';

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export function fromPerformanceListItemResponse(
  res: AdminPerformanceListItemResponse
): PerformanceSummary {
  return {
    id: res.id,
    title: res.title,
    type: res.type,
    status: res.status,
    isVisible: res.isVisible,
    posterImageUrl: res.posterImageUrl ?? null,
    createdAt: res.createdAt,
    seatSelectionEnabled: res.seatSelectionEnabled === true,
  };
}

export function fromPerformanceResponse(
  res: AdminPerformanceResponse
): Performance {
  return {
    ...fromPerformanceListItemResponse(res),
    description: res.description ?? null,
    detailImageUrls: res.detailImageUrls ?? [],
    castPublic: res.castPublic === true,
    updatedAt: res.updatedAt,
  };
}

export function toPerformanceUpsertRequest(
  input: PerformanceFormInput
): PerformanceUpsertRequest {
  return {
    title: input.title.trim(),
    type: input.type,
    status: input.status,
    description: blankToNull(input.description),
    posterImageUrl: input.posterImageUrl,
    detailImageUrls: input.detailImageUrls,
    isVisible: input.isVisible,
  };
}

/** 상세 → 수정 폼 초기값 */
export function toPerformanceFormInput(
  performance: Performance
): PerformanceFormInput {
  return {
    title: performance.title,
    type: performance.type,
    status: performance.status,
    description: performance.description ?? '',
    posterImageUrl: performance.posterImageUrl,
    detailImageUrls: performance.detailImageUrls,
    isVisible: performance.isVisible,
  };
}

export function fromClassItemResponse(
  res: ClassItemResponse
): PerformanceClass {
  return {
    id: res.id,
    performanceId: res.performanceId,
    name: res.name,
    daysOfWeek: res.daysOfWeek ?? [],
    startTime: res.startTime ?? null,
    endTime: res.endTime ?? null,
    deadline: res.deadline ?? null,
    location: res.location ?? null,
    status: res.status,
    createdAt: res.createdAt,
  };
}

export function toClassUpsertRequest(
  input: ClassFormInput
): ClassUpsertRequest {
  return {
    name: input.name.trim(),
    daysOfWeek: input.daysOfWeek,
    startTime: blankToNull(input.startTime),
    endTime: blankToNull(input.endTime),
    deadline: blankToNull(input.deadline),
    location: blankToNull(input.location),
    status: input.status,
  };
}

/** 반 → 수정 폼 초기값 */
export function toClassFormInput(item: PerformanceClass): ClassFormInput {
  return {
    name: item.name,
    daysOfWeek: item.daysOfWeek,
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
    deadline: item.deadline ?? '',
    location: item.location ?? '',
    status: item.status,
  };
}
