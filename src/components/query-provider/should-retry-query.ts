// ----------------------------------------------------------------------
// 조회 재시도 규칙(순수 함수).
// - 4xx 는 재시도하지 않는다(다시 해도 같은 결과).
// - 503 COMMON_005(BFF 가 서버 연결 실패로 10초 기다린 뒤 돌려준 것)는 재시도하지 않는다 — 재시도하면 화면이
//   ≈20초 스켈레톤에 멈춘다(qa2 QA2-007, develop J-17 "10초, 넘으면 503 — 화면이 오래 멈추지 않게").
// - 그 밖 5xx·네트워크 오류는 1회 재시도.
// ----------------------------------------------------------------------
import { ApiError } from '@/src/lib/api-client';

export function shouldRetryQuery(
  failureCount: number,
  error: unknown
): boolean {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500) return false;
    if (error.status === 503 && error.code === 'COMMON_005') return false;
  }
  return failureCount < 1;
}
