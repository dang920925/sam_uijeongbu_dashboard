// ----------------------------------------------------------------------
// 초대 링크 요청 함수(FN-35) — `GET /admin/members/invite-codes` · `POST /admin/members/{id}/invite-code`(발급·재발급).
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromInviteCodeItemResponse,
  type InviteCodeMember,
} from '@/src/api/invite-code-mapper';
import { apiFetch, apiPost } from '@/src/lib/api-client';
import type {
  InviteCodeIssuedResponse,
  InviteCodeItemResponse,
} from '@/src/types/booking';
import type { ItemsResponse } from '@/src/types/common';

export async function fetchInviteCodes(): Promise<InviteCodeMember[]> {
  const res = await apiFetch<ItemsResponse<InviteCodeItemResponse>>(
    endpoints.inviteCodes.list
  );
  return res.items.map(fromInviteCodeItemResponse);
}

/** 없으면 발급, 있으면 재발급(이전 링크 무효) */
export function issueInviteCode(
  memberId: string
): Promise<InviteCodeIssuedResponse> {
  return apiPost<InviteCodeIssuedResponse>(
    endpoints.inviteCodes.issue(memberId)
  );
}
