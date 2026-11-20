// ----------------------------------------------------------------------
// 목 가격 등급(develop §11.10) — 가격 1원 이상(0원 등급 없음 — 사용자 결정) · LINK_ONLY 만 토큰 ·
// 쓰인 등급 삭제 409 TIER_002 · PUBLIC 재발급 409 TIER_003 · 없는 등급 404 TIER_001.
// ----------------------------------------------------------------------
import {
  findPerformanceAlive,
  newTierToken,
  toAdminPriceTier,
} from '@/src/_mock/backend/booking-model';
import {
  apiError,
  json,
  newId,
  noContent,
  nowIso,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type MockPriceTier } from '@/src/_mock/backend/mock-store';
import type { PriceTierVisibility } from '@/src/types/booking';

const VISIBILITIES: PriceTierVisibility[] = ['PUBLIC', 'LINK_ONLY'];

function notFound(ctx: MockContext) {
  return apiError(ctx, 404, 'TIER_001', '가격 등급을 찾을 수 없습니다.');
}

/** 본문의 있는 키만 읽는다(POST 는 name·price·visibility 필수) */
function readTier(
  ctx: MockContext,
  performanceId: string,
  exceptId?: string
): Partial<MockPriceTier> | Response {
  const body = ctx.body;
  const out: Partial<MockPriceTier> = {};
  if ('name' in body) {
    const name = str(body.name)?.trim() ?? '';
    if (name.length < 1 || name.length > 30) return validationError(ctx);
    const duplicated = getStore().priceTiers.some(
      (t) =>
        t.performanceId === performanceId &&
        t.id !== exceptId &&
        t.name === name
    );
    // UNIQUE (performance_id, name) — 오류 코드는 계약에 없어 목은 COMMON_001(확인 필요)
    if (duplicated) return validationError(ctx, '이미 있는 등급 이름입니다.');
    out.name = name;
  }
  if ('price' in body) {
    const price = body.price;
    if (
      typeof price !== 'number' ||
      !Number.isInteger(price) ||
      price < 1 ||
      price > 1_000_000
    )
      return validationError(ctx);
    out.price = price;
  }
  if ('visibility' in body) {
    if (!VISIBILITIES.includes(body.visibility as PriceTierVisibility))
      return validationError(ctx);
    out.visibility = body.visibility as PriceTierVisibility;
  }
  if ('sortOrder' in body) {
    const order = body.sortOrder;
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 0)
      return validationError(ctx);
    out.sortOrder = order;
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') return validationError(ctx);
    out.isActive = body.isActive;
  }
  return out;
}

function byOrder(a: MockPriceTier, b: MockPriceTier) {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
}

export const priceTierRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/price-tiers$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformanceAlive(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const items = getStore()
        .priceTiers.filter((t) => t.performanceId === ctx.params.id)
        .sort(byOrder)
        .map(toAdminPriceTier);
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/price-tiers$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = ctx.params.id;
      if (!findPerformanceAlive(performanceId))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      if (!['name', 'price', 'visibility'].every((key) => key in ctx.body))
        return validationError(ctx);
      const read = readTier(ctx, performanceId);
      if (read instanceof Response) return read;
      const store = getStore();
      const siblings = store.priceTiers.filter(
        (t) => t.performanceId === performanceId
      );
      const tier: MockPriceTier = {
        id: newId(),
        performanceId,
        name: '',
        price: 1,
        visibility: 'PUBLIC',
        linkToken: null,
        sortOrder: siblings.length,
        isActive: true,
        createdAt: nowIso(),
        ...read,
      };
      tier.linkToken = tier.visibility === 'LINK_ONLY' ? newTierToken() : null;
      store.priceTiers.push(tier);
      return json(toAdminPriceTier(tier), 201);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/price-tiers\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const tier = getStore().priceTiers.find((t) => t.id === ctx.params.id);
      if (!tier) return notFound(ctx);
      const read = readTier(ctx, tier.performanceId, tier.id);
      if (read instanceof Response) return read;
      const wasLinkOnly = tier.visibility === 'LINK_ONLY';
      Object.assign(tier, read);
      // PUBLIC ↔ LINK_ONLY 전환 시 토큰 생성·삭제
      if (tier.visibility === 'LINK_ONLY' && !wasLinkOnly)
        tier.linkToken = newTierToken();
      if (tier.visibility === 'PUBLIC') tier.linkToken = null;
      return json(toAdminPriceTier(tier));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/price-tiers\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const tier = store.priceTiers.find((t) => t.id === ctx.params.id);
      if (!tier) return notFound(ctx);
      const used = store.reservations.some((r) =>
        r.items.some((line) => line.tierId === tier.id)
      );
      if (used)
        return apiError(
          ctx,
          409,
          'TIER_002',
          '예매에 쓰인 가격 등급은 삭제할 수 없습니다. 사용 중지로 바꿔주세요.'
        );
      store.priceTiers = store.priceTiers.filter((t) => t.id !== tier.id);
      return noContent();
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/price-tiers\/(?<id>[^/]+)\/link-token$/,
    auth: true,
    handle: (ctx) => {
      const tier = getStore().priceTiers.find((t) => t.id === ctx.params.id);
      if (!tier) return notFound(ctx);
      if (tier.visibility !== 'LINK_ONLY')
        return apiError(
          ctx,
          409,
          'TIER_003',
          '링크 전용 등급만 링크를 재발급할 수 있습니다.'
        );
      tier.linkToken = newTierToken();
      return json(toAdminPriceTier(tier));
    },
  },
];
