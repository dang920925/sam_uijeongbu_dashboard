// ----------------------------------------------------------------------
// 목 입금 알림 기기(U43 — 서버 `/admin/deposit-devices`). 토큰은 목 전용 무작위 43자(base64url) — 저장하지 않는다.
// 상한 5대(DEP_003 400) · 없는 기기 해제 DEP_004 404 · 이름 1~40자.
// ----------------------------------------------------------------------
import { randomBytes, randomUUID } from 'node:crypto';

import {
  apiError,
  json,
  noContent,
  str,
  validationError,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';

const LIMIT = 5;

export const depositDeviceRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/deposit-devices$/,
    auth: true,
    handle: () => json({ items: getStore().depositDevices, limit: LIMIT }),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/deposit-devices$/,
    auth: true,
    handle: (ctx) => {
      const name = str(ctx.body.name)?.trim() ?? '';
      if (name.length < 1 || name.length > 40)
        return validationError(ctx, '기기 이름은 1~40자로 입력해주세요.');
      const store = getStore();
      if (store.depositDevices.length >= LIMIT)
        return apiError(
          ctx,
          400,
          'DEP_003',
          '입금 알림 기기는 5대까지 등록할 수 있습니다. 쓰지 않는 기기를 먼저 해제해주세요.'
        );
      const device = {
        id: randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        lastSeenAt: null,
      };
      store.depositDevices.push(device);
      return json(
        { device, token: randomBytes(32).toString('base64url') },
        201
      );
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/deposit-devices\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const before = store.depositDevices.length;
      store.depositDevices = store.depositDevices.filter(
        (d) => d.id !== ctx.params.id
      );
      if (store.depositDevices.length === before)
        return apiError(
          ctx,
          404,
          'DEP_004',
          '입금 알림 기기를 찾을 수 없습니다.'
        );
      return noContent();
    },
  },
];
