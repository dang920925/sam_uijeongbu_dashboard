// ----------------------------------------------------------------------
// 목 인증(FN-08) — 계약: login 200 {accessToken, expiresAt} / 401 AUTH_001 / 429 AUTH_002(+Retry-After)
// 연속 5회 실패 → 15분 잠금(develop FN-08 첫 단계만 흉내). 자격 증명은 MOCK_ADMIN_USERNAME/PASSWORD(개발 전용).
// ----------------------------------------------------------------------
import { randomUUID } from 'node:crypto';

import {
  apiError,
  json,
  noContent,
  str,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { currentCredentials, getStore } from '@/src/_mock/backend/mock-store';

export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;

export const authRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: /^\/v1\/auth\/login$/,
    auth: false,
    handle: (ctx) => {
      const store = getStore();
      const now = Date.now();
      if (store.lockedUntil > now) {
        const retryAfter = String(Math.ceil((store.lockedUntil - now) / 1000));
        return apiError(
          ctx,
          429,
          'AUTH_002',
          '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          {
            'retry-after': retryAfter,
          }
        );
      }
      const username = str(ctx.body.username);
      const password = str(ctx.body.password);
      const { username: expectedUser, password: expectedPass } =
        currentCredentials();
      if (
        !expectedUser ||
        username !== expectedUser ||
        password !== expectedPass
      ) {
        store.loginFailures += 1;
        if (store.loginFailures >= 5) {
          store.lockedUntil = now + LOCK_MS;
          store.loginFailures = 0;
        }
        return apiError(
          ctx,
          401,
          'AUTH_001',
          '아이디 또는 비밀번호가 올바르지 않습니다.'
        );
      }
      store.loginFailures = 0;
      const accessToken = randomUUID();
      const expiresAt = now + TOKEN_TTL_MS;
      store.sessions.set(accessToken, expiresAt);
      store.sessionVersions.set(accessToken, store.account.sessionVersion);
      return json({
        accessToken,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/auth\/logout$/,
    auth: true,
    handle: (ctx) => {
      if (ctx.req.token) getStore().sessions.delete(ctx.req.token);
      return noContent();
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/auth\/me$/,
    auth: true,
    handle: () =>
      json({
        id: 'mock-admin',
        username: currentCredentials().username,
      }),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/__mock\/unlock$/,
    auth: false,
    handle: () => {
      const store = getStore();
      store.loginFailures = 0;
      store.lockedUntil = 0;
      return noContent();
    },
  },
];
