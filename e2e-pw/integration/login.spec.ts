// ----------------------------------------------------------------------
// 연동 SCR-D01 로그인(FN-08) — 실서버 :420x 의 auth/login 을 BFF(app/api/auth/login)로 거친다.
// - 빈 값: 요청 없이 칸 문구. 401 AUTH_001: 새로고침 없이 실패 박스(B7). 성공: 쿠키 발급 → 요약(/).
// - 잠금: 잠금 전용 계정(INT_LOCK_USERNAME)으로 5회 틀리면 6번째가 429 AUTH_002 + Retry-After(BFF 가 헤더 전달),
//   화면은 서버 message 를 보이고 버튼은 막지 않는다(designer 확인 필요 8 기본안). 끝나면 잠금을 푼다.
// - 로그인 화면이라 세션 없이 시작한다(빈 storageState).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { resetFixtureAdminLocks } from '@/e2e-pw/integration/support/integration-api';

test.use({ storageState: { cookies: [], origins: [] } });

const WRONG_PASSWORD = 'fixture-integration-wrong-password';

type MarkedWindow = Window & { __intMarker?: string };

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`연동 E2E 환경변수 ${key} 가 없습니다.`);
  return value;
}

async function fillLogin(page: Page, username: string, password: string) {
  await page.getByLabel('아이디', { exact: true }).fill(username);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
}

/** 실패 박스(role=alert) — Next 경로 안내(#__next-route-announcer__)도 role=alert 라 뺀다 */
function loginAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

async function submitAndWait(page: Page) {
  const response = page.waitForResponse('**/api/auth/login');
  await page.getByRole('button', { name: '로그인' }).click();
  return response;
}

test.describe('연동 SCR-D01 로그인', () => {
  test.beforeAll(() => resetFixtureAdminLocks());
  test.afterAll(() => resetFixtureAdminLocks());

  test('빈 값으로 제출하면 두 칸에 빈 값 문구를 보이고 요청하지 않는다', async ({
    page,
  }) => {
    // Arrange
    let requested = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/login')) requested = true;
    });
    await page.goto('/login');
    // Act
    await page.getByRole('button', { name: '로그인' }).click();
    // Assert
    await expect(page.getByText('아이디를 입력해주세요')).toBeVisible();
    await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible();
    expect(requested).toBe(false);
  });

  test('틀린 비밀번호는 서버 401 AUTH_001 → 새로고침 없이 실패 문구를 보인다(B7)', async ({
    page,
  }) => {
    // Arrange — 모르는 아이디도 같은 401(계정 잠금 카운트에 영향 없음)
    await page.goto('/login');
    await page.evaluate(() => {
      (window as MarkedWindow).__intMarker = 'kept';
    });
    await fillLogin(page, 'fixture-integration-nobody', WRONG_PASSWORD);
    // Act
    const response = await submitAndWait(page);
    // Assert
    expect(response.status()).toBe(401);
    expect(((await response.json()) as { code: string }).code).toBe('AUTH_001');
    await expect(loginAlert(page)).toHaveText(
      '아이디 또는 비밀번호가 올바르지 않습니다.'
    );
    expect(
      await page.evaluate(() => (window as MarkedWindow).__intMarker)
    ).toBe('kept');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('아이디', { exact: true })).toHaveValue(
      'fixture-integration-nobody'
    );
  });

  test('올바른 아이디·비밀번호면 httpOnly 쿠키를 받고 요약(/)으로 이동한다', async ({
    page,
    context,
  }) => {
    // Arrange
    await page.goto('/login');
    await fillLogin(page, env('INT_ADMIN_USERNAME'), env('INT_ADMIN_PASSWORD'));
    // Act
    const response = await submitAndWait(page);
    // Assert
    expect(response.status()).toBe(204);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: '대시보드' })
    ).toBeVisible();
    const cookie = (await context.cookies()).find(
      (c) => c.name === '__Host-sam_admin'
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Strict');
  });

  test('잠금 계정은 5회 실패 뒤 429 AUTH_002 + Retry-After 를 받고 서버 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/login');
    await fillLogin(page, env('INT_LOCK_USERNAME'), WRONG_PASSWORD);
    for (let i = 0; i < 5; i += 1) {
      expect((await submitAndWait(page)).status()).toBe(401);
    }
    // Act
    const locked = await submitAndWait(page);
    // Assert — BFF 가 서버 Retry-After(초)를 그대로 전달한다(15분 잠금)
    expect(locked.status()).toBe(429);
    expect(((await locked.json()) as { code: string }).code).toBe('AUTH_002');
    const retryAfter = Number(locked.headers()['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);
    await expect(loginAlert(page)).toHaveText(
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    );
    await expect(page.getByRole('button', { name: '로그인' })).toBeEnabled();
    // 잠금 중에는 맞는 비밀번호도 429(검증 없이 거부)
    await page
      .getByLabel('비밀번호', { exact: true })
      .fill(env('INT_ADMIN_PASSWORD'));
    expect((await submitAndWait(page)).status()).toBe(429);
    await expect(page).toHaveURL(/\/login$/);
  });
});
