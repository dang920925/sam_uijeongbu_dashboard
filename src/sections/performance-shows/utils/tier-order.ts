// ----------------------------------------------------------------------
// 가격 등급 순서 ▲▼ — 화면 순서에서 한 칸 옮긴 뒤 0부터 다시 매긴 sortOrder 중 바뀐 것만 돌려준다.
// (추가·삭제로 sortOrder 에 틈·중복이 생겨도 한 번 옮기면 0..n-1 로 정리된다)
// ----------------------------------------------------------------------
import type { PriceTier } from '@/src/api/price-tier-mapper';

export interface TierOrderChange {
  id: string;
  sortOrder: number;
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
