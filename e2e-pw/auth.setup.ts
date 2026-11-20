// ----------------------------------------------------------------------
// 로그인 세션 준비 — BFF 로그인 API 로 httpOnly 쿠키를 받아 storageState 로 저장한다(가이드 A11).
// 로그인 화면 자체의 흐름은 e2e-pw/login.spec.ts 가 따로 검사한다.
// ----------------------------------------------------------------------
import { expect, test as setup } from '@playwright/test';

import { AUTH_STATE } from '@/playwright.config';
import { FIXTURE_ADMIN } from '@/e2e-pw/support/mock-api';

setup('관리자 세션을 만든다', async ({ request }) => {
  await request.post('/api/backend/v1/__mock/unlock');
  const response = await request.post('/api/auth/login', {
    data: FIXTURE_ADMIN,
  });
  expect(response.status()).toBe(204);
  await request.storageState({ path: AUTH_STATE });
});
