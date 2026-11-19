// ----------------------------------------------------------------------
// D04 조회 오류 스낵바 문구 고르기(순수 함수).
// - 상세: 404(not-found)는 전용 화면이라 스낵바 없음, 그 밖 오류만.
// - 반 목록: 상세가 'ready' 일 때만. 반 조회가 상세보다 먼저 실패하면 그 순간 상세는 'loading' 이라
//   예전 조건(not-found 가 아니면)을 통과해 404 화면 위에 스낵바가 떴다(qa2 QA2-003, 10번 중 7번).
// ----------------------------------------------------------------------
import type { PerformanceDetailStatus } from '@/src/sections/performance-detail/view/use-performance-detail-view-model';

export function detailErrorSnackbar(
  status: PerformanceDetailStatus,
  detailErrorMessage: string | null
): string | null {
  return status === 'error' ? detailErrorMessage : null;
}

export function classesErrorSnackbar(
  status: PerformanceDetailStatus,
  classesErrorMessage: string | null
): string | null {
  return status === 'ready' ? classesErrorMessage : null;
}
