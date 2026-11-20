// ----------------------------------------------------------------------
// SCR-D01 로그인(FN-08) — 빈 값 문구, 401 문구가 새로고침 없이 보임(B7 · FN-08 수용 기준),
// 성공 시 요약(/) 이동, 연속 5회 실패 뒤 429 서버 문구. 로그인 화면이라 세션 없이 시작한다.
// 잠금은 같은 목 서버를 쓰는 다른 테스트를 막지 않게 앞뒤로 푼다(__mock/unlock).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { FIXTURE_ADMIN } from '@/e2e-pw/support/mock-api';

test.use({ storageState: { cookies: [], origins: [] } });

const UNLOCK = '/api/backend/v1/__mock/unlock';
const WRONG_PASSWORD = 'fixture-1-w1-wrong-password';

type MarkedWindow = Window & { __w1Marker?: string };

async function fillLogin(page: Page, username: string, password: string) {
  await page.getByLabel('아이디', { exact: true }).fill(username);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
}

async function submitAndWait(page: Page) {
  const response = page.waitForResponse('**/api/auth/login');
  await page.getByRole('button', { name: '로그인' }).click();
  return response;
}

test.describe('SCR-D01 로그인', () => {
  test.beforeEach(async ({ request }) => {
    await request.post(UNLOCK);
  });
  test.afterEach(async ({ request }) => {
    await request.post(UNLOCK);
  });

  test('빈 값으로 제출하면 두 칸에 현행 빈 값 문구를 보이고 요청하지 않는다', async ({
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

  test('틀린 비밀번호(401)는 새로고침 없이 실패 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/login');
    await page.evaluate(() => {
      (window as MarkedWindow).__w1Marker = 'kept';
    });
    await fillLogin(page, FIXTURE_ADMIN.username, WRONG_PASSWORD);
    // Act
    const response = await submitAndWait(page);
    // Assert
    expect(response.status()).toBe(401);
    await expect(
      page.getByText('아이디 또는 비밀번호가 올바르지 않습니다.')
    ).toBeVisible();
    expect(await page.evaluate(() => (window as MarkedWindow).__w1Marker)).toBe(
      'kept'
    );
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('아이디', { exact: true })).toHaveValue(
      FIXTURE_ADMIN.username
    );
  });

  test('올바른 아이디·비밀번호면 요약(/)으로 이동한다', async ({ page }) => {
    // Arrange
    await page.goto('/login');
    await fillLogin(page, FIXTURE_ADMIN.username, FIXTURE_ADMIN.password);
    // Act
    await page.getByRole('button', { name: '로그인' }).click();
    // Assert
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: '대시보드' })
    ).toBeVisible();
  });

  test('연속 5회 틀리면 6번째는 잠금(429) 서버 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/login');
    await fillLogin(page, FIXTURE_ADMIN.username, WRONG_PASSWORD);
    for (let i = 0; i < 5; i += 1) {
      expect((await submitAndWait(page)).status()).toBe(401);
    }
    // Act
    const locked = await submitAndWait(page);
    // Assert
    expect(locked.status()).toBe(429);
    await expect(
      page.getByText('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeEnabled();
  });
});
