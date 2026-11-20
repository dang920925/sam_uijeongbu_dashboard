// ----------------------------------------------------------------------
// 계정 변경 요청 함수(U25, FN-41). BFF `PATCH /api/auth/account` 가 새 토큰을 쿠키로 바꿔 넣고
// 본문은 `{ username }` 만 돌려준다(develop §11.5).
// ----------------------------------------------------------------------
import {
  toAccountUpdateRequest,
  type AccountFormInput,
} from '@/src/api/account-mapper';
import { endpoints } from '@/src/api/endpoints';
import { apiPatch } from '@/src/lib/api-client';
import type { AccountUpdateResponse } from '@/src/types/account';

export function updateAccount(
  input: AccountFormInput
): Promise<AccountUpdateResponse> {
  return apiPatch<AccountUpdateResponse>(
    endpoints.account.update,
    toAccountUpdateRequest(input)
  );
}
