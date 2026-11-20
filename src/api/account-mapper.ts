// ----------------------------------------------------------------------
// 계정 변경 매퍼(U25, FN-41) — 폼 값 → develop §11.5 AccountUpdateRequest.
// 새 아이디는 앞뒤 공백을 떼고, 새 비밀번호가 빈 칸이면 null(비밀번호 유지). 비밀번호는 손대지 않는다.
// ----------------------------------------------------------------------
import type { AccountUpdateRequest } from '@/src/types/account';

/** 계정 설정 폼 값(확인 칸은 화면 검증용이라 요청에 넣지 않는다) */
export interface AccountFormInput {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}

export function toAccountUpdateRequest(
  input: AccountFormInput
): AccountUpdateRequest {
  return {
    currentPassword: input.currentPassword,
    newUsername: input.newUsername.trim(),
    newPassword: input.newPassword === '' ? null : input.newPassword,
  };
}
