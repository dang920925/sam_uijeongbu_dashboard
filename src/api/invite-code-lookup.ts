// ----------------------------------------------------------------------
// 등급 링크 + 단원 초대 링크용 단원 조회·발급(develop §11.4 FN-35) — SCR-D11 링크 복사 메뉴 전용.
// (예매 관리 SCR-D12 의 초대 링크 탭은 W2 의 src/api/invite-code*.ts — 같은 엔드포인트를 따로 부른다)
// POST 는 코드가 있으면 재발급(이전 링크 무효)이라 코드가 없는 단원에게만 부른다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromInviteCodeItemResponse,
  type InviteMember,
} from '@/src/api/price-tier-mapper';
import { apiFetch, apiPost } from '@/src/lib/api-client';
import type {
  InviteCodeIssuedResponse,
  InviteCodeItemResponse,
} from '@/src/types/booking';
import type { ItemsResponse } from '@/src/types/common';

export async function fetchInviteMembers(): Promise<InviteMember[]> {
  const res = await apiFetch<ItemsResponse<InviteCodeItemResponse>>(
    endpoints.inviteCodes.list
  );
  return res.items.map(fromInviteCodeItemResponse);
}

/** 초대 코드 발급 → 코드 */
export async function issueInviteCode(memberId: string): Promise<string> {
  const res = await apiPost<InviteCodeIssuedResponse>(
    endpoints.inviteCodes.issue(memberId)
  );
  return res.inviteCode;
}
