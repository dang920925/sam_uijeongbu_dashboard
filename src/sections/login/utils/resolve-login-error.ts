// ----------------------------------------------------------------------
// 로그인 실패 → 화면 문구(순수 함수).
// - 401(AUTH_001): 현행 실패 박스 문구(Login.tsx:72-74) — 새로고침 없이 보인다(B7).
// - 그 밖에 서버 오류 본문이 있으면(429 AUTH_002 잠금 등) 서버 message 그대로(develop FN-08, designer W3 D01).
// - 본문이 없는 실패(네트워크 등)는 COMMON_004 문구(develop §3.1) — 자격 증명 오류로 오해하지 않게.
// ----------------------------------------------------------------------
import { ApiError } from '@/src/lib/api-client';
import { MSG_API } from '@/src/shared/messages/common';
import { MSG_D01 } from '@/src/shared/messages/d01';

export function resolveLoginError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.status === 401) return MSG_D01.AUTH_FAILED;
    if (error.payload) return error.payload.message;
  }
  return MSG_API.SERVER_ERROR;
}
