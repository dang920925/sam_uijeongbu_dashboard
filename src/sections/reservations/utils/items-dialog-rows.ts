// ----------------------------------------------------------------------
// 등급 수정 Dialog 줄(J-77 — 같은 등급은 예매 당시 가격 유지):
// 예매에 있던 등급 줄 = "예매 당시 {가격}"(사용 중지된 등급이어도 남김) + 그 밖 사용 중 등급 = "지금 가격 {가격}".
// ----------------------------------------------------------------------
import { formatWon, type Reservation } from '@/src/api/reservation-mapper';
import type { TierQuantityRow } from '@/src/components/manual-reservation-dialog/tier-quantity-list';
import type { ReservationTierOption } from '@/src/api/reservation-tier-options';
import { MSG_D12 } from '@/src/shared/messages/d12';

export interface ItemsDialogRows {
  rows: TierQuantityRow[];
  /** 미리 계산용 단가(tierId → 원) */
  prices: Record<string, number>;
}

export function toItemsDialogRows(
  reservation: Pick<Reservation, 'items'>,
  tierOptions: ReservationTierOption[]
): ItemsDialogRows {
  const rows: TierQuantityRow[] = [];
  const prices: Record<string, number> = {};
  for (const line of reservation.items) {
    if (line.isCustom || !line.tierId) continue;
    prices[line.tierId] = line.unitPrice ?? 0;
    rows.push({
      id: line.tierId,
      name: line.tierName,
      priceText: MSG_D12.ITEMS_PRICE_KEPT(formatWon(line.unitPrice ?? 0)),
      isLinkOnly: line.visibility === 'LINK_ONLY',
    });
  }
  for (const tier of tierOptions) {
    if (tier.id in prices) continue;
    prices[tier.id] = tier.price;
    rows.push({
      id: tier.id,
      name: tier.name,
      priceText: MSG_D12.ITEMS_PRICE_NOW(formatWon(tier.price)),
      isLinkOnly: tier.visibility === 'LINK_ONLY',
    });
  }
  return { rows, prices };
}
