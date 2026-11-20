// ----------------------------------------------------------------------
// 초대 링크 매퍼(FN-35) — 계약 InviteCodeItem → 화면 모델, 링크 조립.
// 링크 = `{CLIENT_PUBLIC_URL}/works/{performanceId}/book?ref={inviteCode}`(develop §11.4) — 대시보드가 만든다.
// ----------------------------------------------------------------------
import type { InviteCodeItemResponse } from '@/src/types/booking';
import type { MemberType } from '@/src/types/codes';

export interface InviteCodeMember {
  memberId: string;
  name: string;
  type: MemberType;
  /** 발급 전이면 null(빈 문자열도 null) */
  inviteCode: string | null;
}

export function fromInviteCodeItemResponse(
  res: InviteCodeItemResponse
): InviteCodeMember {
  return {
    memberId: res.memberId,
    name: res.name,
    type: res.type,
    inviteCode: res.inviteCode || null,
  };
}

/** 초대 링크 — 주소·공연·코드 중 하나라도 없으면 null */
export function toInviteLink(
  clientPublicUrl: string | null,
  performanceId: string | null,
  inviteCode: string | null
): string | null {
  if (!clientPublicUrl || !performanceId || !inviteCode) return null;
  const base = clientPublicUrl.replace(/\/+$/, '');
  return `${base}/works/${encodeURIComponent(performanceId)}/book?ref=${encodeURIComponent(inviteCode)}`;
}
