// ----------------------------------------------------------------------
// 가격 등급 표·카드 표시 모델(design §6.1b · designer 시안 보강2 가격 등급 카드).
// - 노출 Label: 누구나 = neutral, 링크 전용 = info(designer 시안).
// - 삭제: 쓰인 등급(usedQty > 0)은 비활성 + 툴팁(design §6.1b).
// - 링크 복사: 링크 전용만, CLIENT_PUBLIC_URL 이 없으면 버튼 비활성 + 이유.
// ----------------------------------------------------------------------
import { buildTierLink, type PriceTier } from '@/src/api/price-tier-mapper';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D11 } from '@/src/shared/messages/d11';
import type { LabelTone } from '@/src/theme/semantic';

const WON = new Intl.NumberFormat('ko-KR');

export function formatWon(amount: number): string {
  return `${WON.format(amount)}${MSG_BOOKING.WON}`;
}

export interface TierRowDisplay {
  id: string;
  name: string;
  priceText: string;
  visibilityLabel: string;
  visibilityTone: LabelTone;
  isLinkOnly: boolean;
  isActive: boolean;
  usedText: string;
  usedCardText: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
  /** 링크 전용이고 주소가 있으면 등급 링크, 아니면 null */
  link: string | null;
}

export function toTierRowDisplay(
  tier: PriceTier,
  index: number,
  count: number,
  clientPublicUrl: string | null,
  performanceId: string
): TierRowDisplay {
  const isLinkOnly = tier.visibility === 'LINK_ONLY';
  return {
    id: tier.id,
    name: tier.name,
    priceText: formatWon(tier.price),
    visibilityLabel: MSG_D11.VISIBILITY_LABEL[tier.visibility],
    visibilityTone: isLinkOnly ? 'info' : 'neutral',
    isLinkOnly,
    isActive: tier.isActive,
    usedText: MSG_D11.TIER_USED(tier.usedQty),
    usedCardText: MSG_D11.TIER_CARD_USED(tier.usedQty),
    canMoveUp: index > 0,
    canMoveDown: index < count - 1,
    canDelete: tier.usedQty === 0,
    link: isLinkOnly
      ? buildTierLink(clientPublicUrl, performanceId, tier.linkToken)
      : null,
  };
}
