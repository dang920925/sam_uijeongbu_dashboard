// ----------------------------------------------------------------------
// 가격 등급 요청 함수(develop §11.10) — `/admin/performances/{id}/price-tiers`(목록 `{ items }`, sortOrder 순)·
// `/admin/price-tiers/{id}`·`/admin/price-tiers/{id}/link-token`.
// ⚠ endpoints.ts 에 등급 경로가 아직 없어(리드에게 보고, 공용 파일) 같은 접두사로 여기서 만든다 —
//   endpoints.performances.priceTiers·priceTiers.* 가 생기면 그것으로 바꾼다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminPriceTierResponse,
  toPriceTierCreateRequest,
  toPriceTierPatchRequest,
  type PriceTier,
  type PriceTierFormInput,
} from '@/src/api/price-tier-mapper';
import { apiDelete, apiFetch, apiPatch, apiPost } from '@/src/lib/api-client';
import type {
  AdminPriceTierResponse,
  PriceTierPatchRequest,
} from '@/src/types/booking';
import type { ItemsResponse } from '@/src/types/common';

const tierPaths = {
  list: endpoints.performances.priceTiers,
  detail: endpoints.priceTiers.detail,
  linkToken: endpoints.priceTiers.linkToken,
};

export async function fetchPriceTiers(
  performanceId: string
): Promise<PriceTier[]> {
  const res = await apiFetch<ItemsResponse<AdminPriceTierResponse>>(
    tierPaths.list(performanceId)
  );
  return res.items.map(fromAdminPriceTierResponse);
}

/** 추가 — sortOrder 는 화면이 정한 맨 뒤 순서(서버 기본 0) */
export async function createPriceTier(
  performanceId: string,
  input: PriceTierFormInput,
  sortOrder?: number
): Promise<PriceTier> {
  return fromAdminPriceTierResponse(
    await apiPost<AdminPriceTierResponse>(
      tierPaths.list(performanceId),
      toPriceTierCreateRequest(input, sortOrder)
    )
  );
}

export async function savePriceTier(
  id: string,
  input: PriceTierFormInput
): Promise<PriceTier> {
  return patchPriceTier(id, toPriceTierPatchRequest(input));
}

/** 부분 수정 — 사용 스위치(isActive)·순서(sortOrder) */
export async function patchPriceTier(
  id: string,
  patch: PriceTierPatchRequest
): Promise<PriceTier> {
  return fromAdminPriceTierResponse(
    await apiPatch<AdminPriceTierResponse>(tierPaths.detail(id), patch)
  );
}

export async function deletePriceTier(id: string): Promise<void> {
  await apiDelete(tierPaths.detail(id));
}

/** 링크 재발급(LINK_ONLY 만 — 이전 링크 무효, PUBLIC 은 409 TIER_003) */
export async function reissuePriceTierLink(id: string): Promise<PriceTier> {
  return fromAdminPriceTierResponse(
    await apiPost<AdminPriceTierResponse>(tierPaths.linkToken(id))
  );
}
