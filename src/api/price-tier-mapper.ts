// ----------------------------------------------------------------------
// 가격 등급 매퍼(develop §11.10 AdminPriceTier·PriceTierCreate/Patch) ↔ 화면 모델·다이얼로그 폼 값. 순수 함수(+ spec).
// 가격은 1~1,000,000원(0원 등급 없음 — 사용자 결정). 링크 = `{CLIENT_PUBLIC_URL}/works/{performanceId}/book?tier=…(&ref=…)`.
// ----------------------------------------------------------------------
import { toIntOrNull } from '@/src/api/show-mapper';
import type {
  AdminPriceTierResponse,
  InviteCodeItemResponse,
  PriceTierCreateRequest,
  PriceTierPatchRequest,
  PriceTierRole,
  PriceTierVisibility,
} from '@/src/types/booking';

export interface PriceTier {
  id: string;
  name: string;
  price: number;
  visibility: PriceTierVisibility;
  linkToken: string | null;
  sortOrder: number;
  isActive: boolean;
  usedQty: number;
  /** (U41) 가격 역할 — 예전 등급은 null */
  role: PriceTierRole | null;
}

/** 등급 다이얼로그 폼 값 — 가격은 입력칸 문자열 그대로 */
export interface PriceTierFormInput {
  name: string;
  price: string;
  visibility: PriceTierVisibility;
  isActive: boolean;
}

/** 링크 복사용 단원(초대 코드 목록 항목) */
export interface InviteMember {
  memberId: string;
  name: string;
  inviteCode: string | null;
}

export const EMPTY_PRICE_TIER_FORM: PriceTierFormInput = {
  name: '',
  price: '',
  visibility: 'PUBLIC',
  isActive: true,
};

export function fromAdminPriceTierResponse(
  res: AdminPriceTierResponse
): PriceTier {
  return {
    id: res.id,
    name: res.name,
    price: res.price,
    visibility: res.visibility,
    linkToken: res.linkToken ?? null,
    sortOrder: res.sortOrder,
    isActive: res.isActive,
    usedQty: res.usedQty,
    role: res.role ?? null,
  };
}

/**
 * 추가 요청 — sortOrder 를 주면 그 순서로(화면은 맨 뒤 = 가장 큰 값 + 1 을 준다).
 * 서버는 sortOrder 를 빼면 0 으로 넣는다(맨 뒤가 아님 — integration 실측).
 */
export function toPriceTierCreateRequest(
  input: PriceTierFormInput,
  sortOrder?: number
): PriceTierCreateRequest {
  return {
    name: input.name.trim(),
    price: toIntOrNull(input.price) ?? 0,
    visibility: input.visibility,
    ...(sortOrder === undefined ? {} : { sortOrder }),
    isActive: input.isActive,
  };
}

/** 수정 요청 — 다이얼로그 칸만(순서·사용 스위치는 표에서 따로 PATCH) */
export function toPriceTierPatchRequest(
  input: PriceTierFormInput
): PriceTierPatchRequest {
  return toPriceTierCreateRequest(input);
}

export function toPriceTierFormInput(tier: PriceTier): PriceTierFormInput {
  return {
    name: tier.name,
    price: String(tier.price),
    visibility: tier.visibility,
    isActive: tier.isActive,
  };
}

export function fromInviteCodeItemResponse(
  res: InviteCodeItemResponse
): InviteMember {
  return {
    memberId: res.memberId,
    name: res.name,
    inviteCode: res.inviteCode ?? null,
  };
}

/** 등급 링크(+ 단원 초대 코드) — 주소가 없으면 null */
export function buildTierLink(
  clientPublicUrl: string | null,
  performanceId: string,
  linkToken: string | null,
  inviteCode?: string | null
): string | null {
  if (!clientPublicUrl || !linkToken) return null;
  const base = `${clientPublicUrl}/works/${encodeURIComponent(performanceId)}/book?tier=${encodeURIComponent(linkToken)}`;
  return inviteCode ? `${base}&ref=${encodeURIComponent(inviteCode)}` : base;
}
