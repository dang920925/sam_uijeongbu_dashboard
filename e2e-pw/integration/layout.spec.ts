// ----------------------------------------------------------------------
// 연동 SCR-D00 공용 틀 — 실서버 세션으로 메뉴 8개·활성 표시, 세션 쿠키 없음 → /login,
// 로그아웃(FN-08: 서버 세션 버전 +1 → 그 토큰이 서버에서 401) → /login,
// 서버가 토큰을 거부(로그아웃된 세션)하면 API 401 AUTH_003 → BFF 가 쿠키를 지우고 화면은 /login 으로 1회 이동.
// 로그아웃·세션 무효화는 반드시 로그아웃 전용 계정(INT_SESSION_USERNAME)으로 한다 — 픽스처 관리자 세션은 다른 스펙이 쓴다.
// ----------------------------------------------------------------------
import { expect, test, type Browser } from '@playwright/test';

import {
  INT_API_BASE_URL,
  resetFixtureAdminLocks,
} from '@/e2e-pw/integration/support/integration-api';

const MENU = [
  '대시보드',
  '공연 관리',
  '단원 관리',
  '신청서 관리',
  '갤러리',
  '일정 관리',
  '연출진 관리',
  '팝업 관리',
];

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`연동 E2E 환경변수 ${key} 가 없습니다.`);
  return value;
}

/** 로그아웃 전용 계정으로 BFF 로그인한 새 컨텍스트(공유 storageState 를 건드리지 않는다) */
async function sessionContext(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 1440, height: 900 },
  });
  const login = await context.request.post(`${baseURL}/api/auth/login`, {
    data: {
      username: env('INT_SESSION_USERNAME'),
      password: env('INT_ADMIN_PASSWORD'),
    },
  });
  expect(login.status()).toBe(204);
  return context;
}

test.describe('연동 SCR-D00 대시보드 공용', () => {
  test.beforeAll(() => resetFixtureAdminLocks());

  test('메뉴 8개를 순서대로 보여 주고 이동하면 활성 메뉴가 바뀐다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '관리자 메뉴' }).last();
    // Assert
    await expect(nav.getByRole('link')).toHaveText(MENU);
    await expect(nav.getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    // Act
    await nav.getByRole('link', { name: '공연 관리' }).click();
    // Assert
    await expect(page).toHaveURL(/\/performances$/);
    await expect(nav.getByRole('link', { name: '공연 관리' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('세션 쿠키가 없으면 관리 화면 대신 로그인으로 보낸다', async ({
    browser,
  }) => {
    // Arrange
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    // Act
    await page.goto('/applications');
    // Assert
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });

  test('로그아웃하면 서버 세션이 끝나고 쿠키가 지워져 로그인 화면으로 간다', async ({
    browser,
    baseURL,
  }) => {
    // Arrange
    const context = await sessionContext(browser, baseURL);
    const token = (await context.cookies()).find(
      (c) => c.name === '__Host-sam_admin'
    )?.value;
    expect(token).toBeTruthy();
    const page = await context.newPage();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: '대시보드' })
    ).toBeVisible();
    // Act
    const logout = page.waitForResponse('**/api/auth/logout');
    await page.getByRole('button', { name: '로그아웃' }).first().click();
    // Assert
    expect((await logout).status()).toBe(204);
    await expect(page).toHaveURL(/\/login$/);
    expect(
      (await context.cookies()).some((c) => c.name === '__Host-sam_admin')
    ).toBe(false);
    // 서버도 그 토큰을 더 받지 않는다(세션 버전 +1)
    const me = await fetch(`${INT_API_BASE_URL}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(401);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });

  test('서버가 토큰을 거부하면(401 AUTH_003) 쿠키를 지우고 로그인으로 이동한다', async ({
    browser,
    baseURL,
  }) => {
    // Arrange — 쿠키는 남아 있지만 서버 세션은 다른 곳에서 로그아웃됨
    const context = await sessionContext(browser, baseURL);
    const token = (await context.cookies()).find(
      (c) => c.name === '__Host-sam_admin'
    )?.value;
    const serverLogout = await fetch(`${INT_API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(serverLogout.status).toBe(204);
    const page = await context.newPage();
    // Act
    const summary = page.waitForResponse(
      '**/api/backend/v1/admin/dashboard/summary'
    );
    await page.goto('/');
    // Assert
    const response = await summary;
    expect(response.status()).toBe(401);
    expect(((await response.json()) as { code: string }).code).toBe('AUTH_003');
    await expect(page).toHaveURL(/\/login$/);
    expect(
      (await context.cookies()).some((c) => c.name === '__Host-sam_admin')
    ).toBe(false);
    await context.close();
  });
});
