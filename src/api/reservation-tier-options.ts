// ----------------------------------------------------------------------
// 예매 등록·등급 수정 Dialog 의 등급 선택지(읽기 전용) — `GET /admin/performances/{id}/price-tiers`(develop §11.10).
// 사용 중(isActive) 등급만, sortOrder 순. 관리자 등록은 PUBLIC·LINK_ONLY 모두 고를 수 있다.
// (등급 관리 CRUD 는 D11 의 src/api/price-tier*.ts — 이 파일은 D12·D13 선택지 전용)
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { apiFetch } from '@/src/lib/api-client';
import type {
  AdminPriceTierResponse,
  PriceTierVisibility,
} from '@/src/types/booking';
import type { ItemsResponse } from '@/src/types/common';

/** 선택지 한 줄(ManualReservationDialog 의 tierOptions 와 같은 모양) */
export interface ReservationTierOption {
  id: string;
  name: string;
  price: number;
  visibility: PriceTierVisibility;
}

export function toReservationTierOptions(
  tiers: AdminPriceTierResponse[]
): ReservationTierOption[] {
  return tiers
    .filter((tier) => tier.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ id, name, price, visibility }) => ({
      id,
      name,
      price,
      visibility,
    }));
}

export async function fetchReservationTierOptions(
  performanceId: string
): Promise<ReservationTierOption[]> {
  const res = await apiFetch<ItemsResponse<AdminPriceTierResponse>>(
    // ⚠ endpoints.performances.priceTiers 가 아직 없어(리드에게 보고) 공연 상세 경로에 붙인다
    endpoints.performances.priceTiers(performanceId)
  );
  return toReservationTierOptions(res.items);
}
