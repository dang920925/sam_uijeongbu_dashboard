// RSV_007(version 불일치)·RSV_008(지금 상태에서 할 수 없음) — 다른 스태프가 먼저 처리한 경우(지휘자 결정 2026-11-20:
// 정본 스낵바 "다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다." + 목록 재조회).
import { ApiError } from '@/src/lib/api-client';

const CONFLICT_CODES = new Set(['RSV_007', 'RSV_008']);

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && CONFLICT_CODES.has(error.code ?? '');
}
