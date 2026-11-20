// ----------------------------------------------------------------------
// 연동 E2E 세션 준비 — 실제 서버의 픽스처 관리자(INT_ADMIN_USERNAME)로 BFF 로그인해 httpOnly 쿠키를 저장한다.
// 시작 전에 모든 연동 픽스처(fixture-integration-*)와 픽스처 계정 잠금을 정리해 "현재 상태"에서 출발한다.
// ----------------------------------------------------------------------
import { expect, test as setup } from '@playwright/test';

import {
  cleanupFixtures,
  FIXTURE_BASE,
  resetFixtureAdminLocks,
} from '@/e2e-pw/integration/support/integration-api';
import { INTEGRATION_AUTH_STATE } from '@/playwright.config';

setup('실서버 관리자 세션을 만든다', async ({ request }) => {
  cleanupFixtures(FIXTURE_BASE);
  resetFixtureAdminLocks();
  const response = await request.post('/api/auth/login', {
    data: {
      username: process.env.INT_ADMIN_USERNAME,
      password: process.env.INT_ADMIN_PASSWORD,
    },
  });
  expect(response.status()).toBe(204);
  await request.storageState({ path: INTEGRATION_AUTH_STATE });
});
