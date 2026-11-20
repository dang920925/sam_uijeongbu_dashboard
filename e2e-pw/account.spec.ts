// ----------------------------------------------------------------------
// SCR-D15 계정 설정(U25, FN-41) — 수용 기준 S30~S33(develop §11.5).
// 계정을 바꾸면 공용 storageState 세션(버전 0)이 끊기므로 앞뒤로 resetMock(계정·버전 되돌림)과 잠금 해제를 부른다.
// 목 전용: 아이디 'fixture-taken' = 이미 사용 중(409 ACC_002).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { FIXTURE_ADMIN, resetMock } from '@/e2e-pw/support/mock-api';
import { AUTH_STATE } from '@/playwright.config';

const PREFIX = 'fixture-r1-w4-';
const NEW_USERNAME = `${PREFIX}admin`;
const NEW_PASSWORD = `${PREFIX}new-password-15+`;
const UNLOCK = '/api/backend/v1/__mock/unlock';

function fields(page: Page) {
  return {
    currentUsername: page.getByLabel('현재 아이디'),
    currentPassword: page.getByLabel('현재 비밀번호'),
    newUsername: page.getByLabel('새 아이디'),
    newPassword: page.getByLabel('새 비밀번호 (비우면 유지)'),
    confirmPassword: page.getByLabel('새 비밀번호 확인'),
    save: page.getByRole('button', { name: '저장' }),
  };
}

async function openAccount(page: Page) {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: '계정 설정' })).toBeVisible();
  await expect(fields(page).newUsername).toHaveValue(FIXTURE_ADMIN.username);
}

test.describe('SCR-D15 계정 설정', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
    await request.post(UNLOCK);
  });
  test.afterEach(async ({ request }) => {
    await resetMock(request);
    await request.post(UNLOCK);
  });

  test('S30 현재 비밀번호가 틀리면 그 칸 아래에 ACC_001 문구를 보이고 포커스를 옮긴다', async ({
    page,
  }) => {
    // Arrange
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(`${PREFIX}wrong-password`);
    await f.newUsername.fill(NEW_USERNAME);
    // Act
    const response = page.waitForResponse('**/api/auth/account');
    await f.save.click();
    // Assert
    expect((await response).status()).toBe(400);
    await expect(
      page.getByText('현재 비밀번호가 올바르지 않습니다.')
    ).toBeVisible();
    await expect(f.currentPassword).toHaveAttribute('aria-invalid', 'true');
    await expect(f.currentPassword).toBeFocused();
    await expect(page).toHaveURL(/\/account$/);
  });

  test('S31 바꾸면 스낵바·현재 아이디가 바뀌고 비밀번호 칸이 비며, 새 자격으로만 로그인된다', async ({
    page,
    browser,
    baseURL,
  }) => {
    // Arrange
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(FIXTURE_ADMIN.password);
    await f.newUsername.fill(NEW_USERNAME);
    await f.newPassword.fill(NEW_PASSWORD);
    await f.confirmPassword.fill(NEW_PASSWORD);
    // Act
    const response = page.waitForResponse('**/api/auth/account');
    await f.save.click();
    // Assert — 본문에 토큰이 없다(BFF 가 쿠키로 바꿔 넣음)
    const body: unknown = await (await response).json();
    expect(body).toEqual({ username: NEW_USERNAME });
    await expect(page.getByText('계정 정보가 바뀌었습니다.')).toBeVisible();
    await expect(f.currentUsername).toHaveText(NEW_USERNAME);
    await expect(f.currentPassword).toHaveValue('');
    await expect(f.newPassword).toHaveValue('');
    await expect(f.confirmPassword).toHaveValue('');
    // 바꾼 기기는 새 쿠키로 계속 쓴다
    await page.reload();
    await expect(f.currentUsername).toHaveText(NEW_USERNAME);

    const fresh = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const ok = await fresh.request.post(`${baseURL}/api/auth/login`, {
      data: { username: NEW_USERNAME, password: NEW_PASSWORD },
    });
    const old = await fresh.request.post(`${baseURL}/api/auth/login`, {
      data: { username: NEW_USERNAME, password: FIXTURE_ADMIN.password },
    });
    expect(ok.status()).toBe(204);
    expect(old.status()).toBe(401);
    await fresh.close();
  });

  test('S32 다른 브라우저 컨텍스트의 세션은 다음 요청에서 로그인 화면으로 가고, 바꾼 쪽은 그대로다', async ({
    page,
    browser,
  }) => {
    // Arrange — 같은 세션(버전 0)을 쓰는 두 번째 기기
    const other = await browser.newContext({ storageState: AUTH_STATE });
    const otherPage = await other.newPage();
    await otherPage.goto('/performances');
    await expect(
      otherPage.getByRole('heading', { name: '공연 관리' })
    ).toBeVisible();
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(FIXTURE_ADMIN.password);
    await f.newUsername.fill(NEW_USERNAME);
    // Act
    await f.save.click();
    await expect(page.getByText('계정 정보가 바뀌었습니다.')).toBeVisible();
    await otherPage.goto('/members');
    // Assert
    await expect(otherPage).toHaveURL(/\/login$/);
    await page.goto('/members');
    await expect(
      page.getByRole('heading', { name: '단원 관리' })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/members$/);
    await other.close();
  });

  test('S33 15자 미만 비밀번호·규칙 밖 아이디·불일치는 요청 없이 칸 아래에 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    let requested = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/account')) requested = true;
    });
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(FIXTURE_ADMIN.password);
    await f.newUsername.fill('관리자');
    await f.newPassword.fill('short-pw');
    await f.confirmPassword.fill('short-pw-x');
    // Act
    await f.save.click();
    // Assert
    await expect(
      page.getByText('아이디는 4~50자의 영문·숫자·._- 만 쓸 수 있습니다.')
    ).toBeVisible();
    await expect(
      page.getByText('비밀번호는 15자 이상이어야 합니다.')
    ).toBeVisible();
    await expect(page.getByText('새 비밀번호가 서로 다릅니다.')).toBeVisible();
    await expect(page.getByText('4~50자 영문·숫자·. _ -')).toBeVisible();
    await expect(f.newUsername).toBeFocused();
    expect(requested).toBe(false);
  });

  test('S33 서버 검증 — 중복 아이디는 새 아이디 아래 ACC_002, 15자 미만은 400 COMMON_001', async ({
    page,
    request,
  }) => {
    // Arrange
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(FIXTURE_ADMIN.password);
    await f.newUsername.fill('fixture-taken');
    // Act
    const response = page.waitForResponse('**/api/auth/account');
    await f.save.click();
    // Assert
    expect((await response).status()).toBe(409);
    await expect(page.getByText('이미 사용 중인 아이디입니다.')).toBeVisible();
    await expect(f.newUsername).toHaveAttribute('aria-invalid', 'true');

    const short = await request.patch('/api/auth/account', {
      data: {
        currentPassword: FIXTURE_ADMIN.password,
        newUsername: FIXTURE_ADMIN.username,
        newPassword: 'short-pw',
      },
    });
    expect(short.status()).toBe(400);
    expect(((await short.json()) as { code: string }).code).toBe('COMMON_001');
  });

  test('바뀐 것이 없으면 폼 위에 "바뀐 내용이 없습니다."를 보이고, BFF 는 다른 출처 요청을 거부한다', async ({
    page,
    request,
  }) => {
    // Arrange
    await openAccount(page);
    const f = fields(page);
    await f.currentPassword.fill(FIXTURE_ADMIN.password);
    // Act
    await f.save.click();
    // Assert
    await expect(
      page.getByRole('alert').filter({ hasText: '바뀐 내용이 없습니다.' })
    ).toBeVisible();
    const server = await request.patch('/api/auth/account', {
      data: {
        currentPassword: FIXTURE_ADMIN.password,
        newUsername: FIXTURE_ADMIN.username,
      },
    });
    expect(((await server.json()) as { code: string }).code).toBe('ACC_003');
    const crossSite = await request.patch('/api/auth/account', {
      headers: { origin: 'https://evil.example' },
      data: { currentPassword: 'x', newUsername: NEW_USERNAME },
    });
    expect(crossSite.status()).toBe(403);
  });

  test('비밀번호 보기 토글은 이름을 그대로 두고 aria-pressed 로 상태를 알린다', async ({
    page,
  }) => {
    // Arrange
    await openAccount(page);
    const f = fields(page);
    const toggle = page.getByRole('button', { name: '비밀번호 보기' }).first();
    await expect(f.currentPassword).toHaveAttribute('type', 'password');
    await expect(f.currentPassword).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
    await expect(f.newPassword).toHaveAttribute('autocomplete', 'new-password');
    await expect(f.newUsername).toHaveAttribute('autocomplete', 'username');
    // Act
    await toggle.click();
    // Assert
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(f.currentPassword).toHaveAttribute('type', 'text');
    const box = await toggle.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
