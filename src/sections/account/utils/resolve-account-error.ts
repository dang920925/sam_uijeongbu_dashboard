// ----------------------------------------------------------------------
// 계정 변경 실패 → 폼 오류 자리(순수 함수, develop §11.5 · designer §13.7.4 SCR-D15 2.2).
// - ACC_001(400) → 현재 비밀번호 아래 · ACC_002(409) → 새 아이디 아래 · ACC_003(400) → 폼 위.
// - 400 COMMON_001 검증 → 문구로 아이디·비밀번호 칸을 가리고, 모르는 문구는 폼 위.
// - 429(AUTH_002 잠금) → 폼 위 자물쇠 알림(서버 message 그대로).
// - 401 은 null — 전역 처리가 로그인으로 보낸다(이 화면은 401 을 막지 않는다).
// - 본문 없는 실패(네트워크·503 COMMON_005)는 COMMON_004 문구.
// ----------------------------------------------------------------------
import { ApiError } from '@/src/lib/api-client';
import type { AccountFormErrors } from '@/src/sections/account/utils/account-form';
import { MSG_API } from '@/src/shared/messages/common';
import { MSG_D15 } from '@/src/shared/messages/d15';

export function resolveAccountError(error: unknown): AccountFormErrors | null {
  if (!error) return null;
  if (error instanceof ApiError && error.status === 401) return null;
  if (!(error instanceof ApiError) || !error.payload) {
    return {
      fields: {},
      alert: { message: MSG_API.SERVER_ERROR, locked: false },
    };
  }
  const { message } = error.payload;
  switch (error.code) {
    case 'ACC_001':
      return { fields: { currentPassword: message }, alert: null };
    case 'ACC_002':
      return { fields: { newUsername: message }, alert: null };
    case 'COMMON_001':
      if (message === MSG_D15.INVALID_USERNAME)
        return { fields: { newUsername: message }, alert: null };
      if (message === MSG_D15.INVALID_PASSWORD)
        return { fields: { newPassword: message }, alert: null };
      break;
    default:
      break;
  }
  return { fields: {}, alert: { message, locked: error.status === 429 } };
}
