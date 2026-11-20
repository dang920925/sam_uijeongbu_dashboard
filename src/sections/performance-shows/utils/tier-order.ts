// ----------------------------------------------------------------------
// 가격 등급 순서 ▲▼ — 화면 순서에서 한 칸 옮긴 뒤 0부터 다시 매긴 sortOrder 중 바뀐 것만 돌려준다.
// (추가·삭제로 sortOrder 에 틈·중복이 생겨도 한 번 옮기면 0..n-1 로 정리된다)
// ----------------------------------------------------------------------
import type { PriceTier } from '@/src/api/price-tier-mapper';

export interface TierOrderChange {
  id: string;
  sortOrder: number;
}

/** 서버 sortOrder 상한(CreatePriceTierRequestDto 0~999) */
export const TIER_SORT_ORDER_MAX = 999;

/**
 * 새 등급의 sortOrder — 지금 등급 중 가장 큰 값 + 1(없으면 0, 상한 999).
 * 서버는 sortOrder 를 빼면 0 으로 넣고 "순서 → 등록 순"으로 정렬해, ▲▼ 로 0..n-1 이 된 뒤 추가하면
 * 새 등급이 맨 뒤가 아니라 sortOrder 0 무리 끝(중간)에 끼었다(integration 실측 2026-11-20).
 */
export function nextTierSortOrder(
  tiers: Pick<PriceTier, 'sortOrder'>[]
): number {
  if (tiers.length === 0) return 0;
  const max = Math.max(...tiers.map((tier) => tier.sortOrder));
  return Math.min(max + 1, TIER_SORT_ORDER_MAX);
}

export function moveTier(
  tiers: Pick<PriceTier, 'id' | 'sortOrder'>[],
  id: string,
  direction: 'up' | 'down'
): TierOrderChange[] {
  const index = tiers.findIndex((tier) => tier.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= tiers.length) return [];
  const next = [...tiers];
  [next[index], next[target]] = [next[target], next[index]];
  return next
    .map((tier, order) => ({
      id: tier.id,
      sortOrder: order,
      before: tier.sortOrder,
    }))
    .filter((change) => change.sortOrder !== change.before)
    .map(({ id: changedId, sortOrder }) => ({ id: changedId, sortOrder }));
}
