// ----------------------------------------------------------------------
// 실패 → 화면 문구. 서버 message(한국어, develop §3.1 오류 본문)를 그대로 쓰고,
// 본문이 없으면(네트워크 등) COMMON_004 문구. 에러 코드만 단독 노출하지 않는다(style-guide §4.6).
// (작업자 4곳에 복사돼 있던 것을 리드가 공용으로 올림)
// ----------------------------------------------------------------------
import { ApiError } from '@/src/lib/api-client';
import { MSG_API } from '@/src/shared/messages/common';

export function toApiErrorMessage(error: unknown): string {
  return error instanceof ApiError && error.payload
    ? error.message
    : MSG_API.SERVER_ERROR;
}

/** 404(PERF_001·MEM_001 등) 인가 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
