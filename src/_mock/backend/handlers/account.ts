// ----------------------------------------------------------------------
// 목 계정 변경(U25, FN-41) — develop §11.5. 현재 비밀번호 틀림은 로그인과 같은 잠금 카운터에 더한다.
// 성공하면 sessionVersion + 1 → 다른 토큰(다른 기기)은 다음 요청에서 401, 새 토큰만 유효.
// 목 전용: 아이디 'fixture-taken' 은 "이미 사용 중"(409 ACC_002) 시험용.
// ----------------------------------------------------------------------
import { randomUUID } from 'node:crypto';

import { LOCK_MS, TOKEN_TTL_MS } from '@/src/_mock/backend/handlers/auth';
import {
  apiError,
  json,
  str,
  validationError,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { currentCredentials, getStore } from '@/src/_mock/backend/mock-store';

const USERNAME = /^[A-Za-z0-9._-]{4,50}$/;
export const MOCK_TAKEN_USERNAME = 'fixture-taken';

export const accountRoutes: MockRoute[] = [
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/account$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const now = Date.now();
      if (store.lockedUntil > now) {
        return apiError(
          ctx,
          429,
          'AUTH_002',
          '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          { 'retry-after': String(Math.ceil((store.lockedUntil - now) / 1000)) }
        );
      }
      const current = str(ctx.body.currentPassword) ?? '';
      const newUsername = str(ctx.body.newUsername)?.trim() ?? '';
      const newPassword = str(ctx.body.newPassword) || null;
      if (current.length < 1 || current.length > 200)
        return validationError(ctx);
      if (!USERNAME.test(newUsername))
        return validationError(
          ctx,
          '아이디는 4~50자의 영문·숫자·._- 만 쓸 수 있습니다.'
        );
      if (
        newPassword !== null &&
        (newPassword.length < 15 || newPassword.length > 200)
      )
        return validationError(ctx, '비밀번호는 15자 이상이어야 합니다.');
      const creds = currentCredentials();
      if (current !== creds.password) {
        store.loginFailures += 1;
        if (store.loginFailures >= 5) {
          store.lockedUntil = now + LOCK_MS;
          store.loginFailures = 0;
        }
        return apiError(
          ctx,
          400,
          'ACC_001',
          '현재 비밀번호가 올바르지 않습니다.'
        );
      }
      if (newUsername === MOCK_TAKEN_USERNAME)
        return apiError(ctx, 409, 'ACC_002', '이미 사용 중인 아이디입니다.');
      if (newUsername === creds.username && newPassword === null)
        return apiError(ctx, 400, 'ACC_003', '바뀐 내용이 없습니다.');
      store.loginFailures = 0;
      store.account = {
        username: newUsername,
        password: newPassword ?? creds.password,
        sessionVersion: store.account.sessionVersion + 1,
      };
      const accessToken = randomUUID();
      store.sessions.set(accessToken, now + TOKEN_TTL_MS);
      store.sessionVersions.set(accessToken, store.account.sessionVersion);
      return json({ username: newUsername, accessToken });
    },
  },
];
