// ----------------------------------------------------------------------
// 목 새 예매 푸시(U37 — develop §21 `/admin/push/*`). 실제 발송은 없고 기기 목록만 흉내 낸다.
// - 공개키는 목 전용 모양 값(VAPID 공개키 길이 87자 · 0x04 로 시작) — 실제 키 아님.
// - 알려진 푸시 서비스 https 주소만 받는다(서버 PUSH_002 와 같은 호스트).
// - 목 전용: store.pushEnabled=false(`__mock/push-disabled`)면 서버 꺼짐 흉내.
// ----------------------------------------------------------------------
import { randomUUID } from 'node:crypto';

import {
  apiError,
  json,
  noContent,
  str,
  validationError,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';

export const MOCK_PUSH_PUBLIC_KEY = `BA${'A'.repeat(85)}`;
const PUSH_HOSTS =
  /^https:\/\/([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)\//;
const DISABLED_MESSAGE = '이 서버에서는 알림 기능이 꺼져 있습니다.';

export const pushRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/push\/public-key$/,
    auth: true,
    handle: () =>
      json({ publicKey: getStore().pushEnabled ? MOCK_PUSH_PUBLIC_KEY : null }),
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/push\/subscriptions$/,
    auth: true,
    handle: () => json({ items: getStore().pushDevices }),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/push\/subscriptions$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      if (!store.pushEnabled)
        return apiError(ctx, 503, 'PUSH_001', DISABLED_MESSAGE);
      const endpoint = str(ctx.body.endpoint);
      const keys = ctx.body.keys as
        { p256dh?: unknown; auth?: unknown } | undefined;
      if (!endpoint || !str(keys?.p256dh) || !str(keys?.auth))
        return validationError(ctx, '알림 구독 정보가 올바르지 않습니다.');
      if (!PUSH_HOSTS.test(endpoint))
        return apiError(
          ctx,
          400,
          'PUSH_002',
          '지원하지 않는 브라우저 알림 주소입니다.'
        );
      const userAgent = str(ctx.body.userAgent)?.slice(0, 200) || null;
      const existing = store.pushDevices.find((d) => d.endpoint === endpoint);
      if (existing) {
        existing.userAgent = userAgent;
        return json(existing, 201);
      }
      const device = {
        id: randomUUID(),
        endpoint,
        userAgent,
        createdAt: new Date().toISOString(),
        lastSuccessAt: null,
      };
      store.pushDevices.push(device);
      return json(device, 201);
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/push\/subscriptions$/,
    auth: true,
    handle: (ctx) => {
      const endpoint = str(ctx.body.endpoint);
      if (!endpoint)
        return validationError(ctx, '알림 구독 정보가 올바르지 않습니다.');
      const store = getStore();
      store.pushDevices = store.pushDevices.filter(
        (d) => d.endpoint !== endpoint
      );
      return noContent();
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/push\/test$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      if (!store.pushEnabled)
        return apiError(ctx, 503, 'PUSH_001', DISABLED_MESSAGE);
      store.pushTestCalls += 1;
      const now = new Date().toISOString();
      for (const device of store.pushDevices) device.lastSuccessAt = now;
      return json({ sent: store.pushDevices.length, removed: 0, failed: 0 });
    },
  },
  {
    // 목 전용 — 서버 VAPID 키 없음 흉내(resetMock 으로 다시 켜짐)
    method: 'POST',
    pattern: /^\/v1\/__mock\/push-disabled$/,
    auth: false,
    handle: () => {
      getStore().pushEnabled = false;
      return noContent();
    },
  },
];
