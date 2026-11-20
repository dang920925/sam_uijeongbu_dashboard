// 공연 폼 검증(순수 함수) — 제목 필수(현행 zod Performances.tsx:27), 100자 상한(develop PerformanceUpsert).
import { MSG_PERF_FORM } from '@/src/shared/messages/performance-form';
import type { PerformanceFormInput } from '@/src/types/performance';

export interface PerformanceFormErrors {
  title: string | null;
}

export function validatePerformanceForm(
  input: PerformanceFormInput
): PerformanceFormErrors {
  return {
    title: input.title.trim() === '' ? MSG_PERF_FORM.TITLE_REQUIRED : null,
  };
}

/** 새 공연 기본값 — 타입 연극·상태 예정(현행 기본값), 노출 켬(develop 기본 true) */
export const EMPTY_PERFORMANCE_FORM: PerformanceFormInput = {
  title: '',
  type: 'PLAY',
  status: 'UPCOMING',
  description: '',
  posterImageUrl: null,
  detailImageUrls: [],
  isVisible: true,
};
