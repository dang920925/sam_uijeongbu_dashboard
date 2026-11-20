// ----------------------------------------------------------------------
// SCR-D15 계정 설정 연동(U25, FN-41, develop §11.5 · back-end §14.4 #19) — 실서버 + 로컬 DB.
// 공용 세션(fixture-integration-admin)을 끊지 않게 계정 변경 시험 전용 `INT_SESSION_USERNAME` 으로
// 두 기기(브라우저 컨텍스트 A·B)를 BFF 로그인한다.
// 흐름: ACC_001(현재 비밀번호 틀림) · ACC_002(아이디 중복) · ACC_003(바뀐 것 없음 — BFF 중계) ·
// 잠금 429 AUTH_002 + Retry-After · 아이디·비밀번호 변경(A 는 새 쿠키로 계속, B 는 다음 요청 401 → /login).
// 바꾼 아이디는 fixture-integration- 로 시작하고, 끝에 원래 아이디·비밀번호(env)로 되돌린다(실패해도 afterAll 에서).
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

import {
  INT_API_BASE_URL,
  resetFixtureAdminLocks,
} from '@/e2e-pw/integration/support/integration-api';

const SESSION_USERNAME =
  process.env.INT_SESSION_USERNAME ?? 'fixture-integration-session';
const ADMIN_USERNAME =
  process.env.INT_ADMIN_USERNAME ?? 'fixture-integration-admin';
const PASSWORD = process.env.INT_ADMIN_PASSWORD ?? '';
const NEW_USERNAME = `${SESSION_USERNAME}-w3x`;
const NEW_PASSWORD = 'fixture-integration-w3-new-password';

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

/** 빈 컨텍스트에서 BFF 로그인(쿠키는 그 컨텍스트에만) */
async function loggedInContext(
  browser: Browser,
  baseURL: string,
  username: string,
  password: string
): Promise<BrowserContext> {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    baseURL,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  const response = await context.request.post('/api/auth/login', {
    data: { username, password },
  });
  expect(response.status()).toBe(204);
  return context;
}

async function openAccount(page: Page, username: string) {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: '계정 설정' })).toBeVisible();
  await expect(fields(page).newUsername).toHaveValue(username);
}

function accountResponse(page: Page) {
  return page.waitForResponse(
    (r) =>
      r.request().method() === 'PATCH' &&
      new URL(r.url()).pathname === '/api/auth/account'
  );
}

/** 서버 직접 로그인 토큰(없으면 null) */
async function serverLogin(
  username: string,
  password: string
): Promise<string | null> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) return null;
  return ((await response.json()) as { accessToken: string }).accessToken;
}

/** 시험 계정을 원래 아이디·비밀번호로 되돌린다(이미 원래 값이면 그대로) */
async function restoreSessionAccount() {
  resetFixtureAdminLocks();
  if (await serverLogin(SESSION_USERNAME, PASSWORD)) return;
  for (const [username, password] of [
    [NEW_USERNAME, NEW_PASSWORD],
    [NEW_USERNAME, PASSWORD],
    [SESSION_USERNAME, NEW_PASSWORD],
  ]) {
    const token = await serverLogin(username, password);
    if (!token) continue;
    const response = await fetch(`${INT_API_BASE_URL}/api/v1/admin/account`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: password,
        newUsername: SESSION_USERNAME,
        newPassword: password === PASSWORD ? null : PASSWORD,
      }),
    });
    if (!response.ok) {
      throw new Error(`시험 계정 되돌리기 실패 ${response.status}`);
    }
    resetFixtureAdminLocks();
    return;
  }
  throw new Error('시험 계정을 어떤 자격으로도 로그인하지 못했습니다');
}

test.describe('SCR-D15 계정 설정(실서버)', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(restoreSessionAccount);
  test.afterAll(restoreSessionAccount);

  let contextA: BrowserContext;
  let pageA: Page;

  test.beforeEach(async ({ browser, baseURL }) => {
    contextA = await loggedInContext(
      browser,
      baseURL as string,
      SESSION_USERNAME,
      PASSWORD
    );
    pageA = await contextA.newPage();
  });
  test.afterEach(async () => {
    await contextA.close();
  });

  test('현재 비밀번호가 틀리면 400 ACC_001 을 그 칸 아래에 보인다', async () => {
    await openAccount(pageA, SESSION_USERNAME);
    const f = fields(pageA);
    await f.currentPassword.fill('fixture-integration-wrong-password');
    await f.newUsername.fill(NEW_USERNAME);
    const response = accountResponse(pageA);
    await f.save.click();
    const res = await response;
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe('ACC_001');
    await expect(
      pageA.getByText('현재 비밀번호가 올바르지 않습니다.')
    ).toBeVisible();
    await expect(f.currentPassword).toHaveAttribute('aria-invalid', 'true');
    await expect(pageA).toHaveURL(/\/account$/);
  });

  test('다른 관리자가 쓰는 아이디는 409 ACC_002 를 새 아이디 아래에 보인다', async () => {
    await openAccount(pageA, SESSION_USERNAME);
    const f = fields(pageA);
    await f.currentPassword.fill(PASSWORD);
    await f.newUsername.fill(ADMIN_USERNAME);
    const response = accountResponse(pageA);
    await f.save.click();
    const res = await response;
    expect(res.status()).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe('ACC_002');
    await expect(pageA.getByText('이미 사용 중인 아이디입니다.')).toBeVisible();
    await expect(f.newUsername).toHaveAttribute('aria-invalid', 'true');
  });

  test('바뀐 것이 없으면 화면은 요청 전에 막고, BFF 로 보내면 400 ACC_003 을 그대로 중계한다', async () => {
    let requested = false;
    pageA.on('request', (req) => {
      if (req.url().includes('/api/auth/account')) requested = true;
    });
    await openAccount(pageA, SESSION_USERNAME);
    const f = fields(pageA);
    await f.currentPassword.fill(PASSWORD);
    await f.save.click();
    await expect(pageA.getByText('바뀐 내용이 없습니다.')).toBeVisible();
    expect(requested).toBe(false);

    const res = await pageA.request.patch('/api/auth/account', {
      data: {
        currentPassword: PASSWORD,
        newUsername: SESSION_USERNAME,
        newPassword: null,
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      code: 'ACC_003',
      message: '바뀐 내용이 없습니다.',
    });
  });

  test('현재 비밀번호를 계속 틀리면 429 AUTH_002 + Retry-After 로 잠기고 화면은 폼 위에 알린다', async () => {
    try {
      let locked: Awaited<ReturnType<typeof pageA.request.patch>> | null = null;
      for (let attempt = 0; attempt < 6 && !locked; attempt += 1) {
        const res = await pageA.request.patch('/api/auth/account', {
          data: {
            currentPassword: 'fixture-integration-wrong-password',
            newUsername: NEW_USERNAME,
          },
        });
        if (res.status() === 429) locked = res;
        else expect(res.status()).toBe(400);
      }
      expect(locked).not.toBeNull();
      const lockedRes = locked as NonNullable<typeof locked>;
      expect(((await lockedRes.json()) as { code: string }).code).toBe(
        'AUTH_002'
      );
      expect(Number(lockedRes.headers()['retry-after'])).toBeGreaterThan(0);

      await openAccount(pageA, SESSION_USERNAME);
      const f = fields(pageA);
      await f.currentPassword.fill(PASSWORD);
      await f.newUsername.fill(NEW_USERNAME);
      const response = accountResponse(pageA);
      await f.save.click();
      expect((await response).status()).toBe(429);
      await expect(
        pageA.getByRole('alert').filter({
          hasText: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        })
      ).toBeVisible();
      // 잠겨도 세션은 그대로(로그인 화면으로 가지 않음)
      await expect(pageA).toHaveURL(/\/account$/);
    } finally {
      resetFixtureAdminLocks();
    }
  });

  test('아이디·비밀번호를 바꾸면 바꾼 기기는 새 쿠키로 계속 쓰고, 다른 기기는 다음 요청에서 로그인으로 간다', async ({
    browser,
    baseURL,
  }) => {
    const contextB = await loggedInContext(
      browser,
      baseURL as string,
      SESSION_USERNAME,
      PASSWORD
    );
    const pageB = await contextB.newPage();
    await pageB.goto('/members');
    await expect(
      pageB.getByRole('heading', { level: 1, name: '단원 관리' })
    ).toBeVisible();

    await openAccount(pageA, SESSION_USERNAME);
    const cookieBefore = (await contextA.cookies()).map((c) => c.value);
    const f = fields(pageA);
    await f.currentPassword.fill(PASSWORD);
    await f.newUsername.fill(NEW_USERNAME);
    await f.newPassword.fill(NEW_PASSWORD);
    await f.confirmPassword.fill(NEW_PASSWORD);
    const response = accountResponse(pageA);
    await f.save.click();
    const res = await response;
    expect(res.status()).toBe(200);
    // 브라우저에는 토큰 없이 아이디만
    expect(await res.json()).toEqual({ username: NEW_USERNAME });
    await expect(pageA.getByText('계정 정보가 바뀌었습니다.')).toBeVisible();
    await expect(f.currentUsername).toHaveText(NEW_USERNAME);
    await expect(f.currentPassword).toHaveValue('');
    const cookieAfter = (await contextA.cookies()).map((c) => c.value);
    expect(cookieAfter).not.toEqual(cookieBefore);

    // A — 새 쿠키로 계속 쓴다
    await pageA.goto('/members');
    await expect(
      pageA.getByRole('heading', { level: 1, name: '단원 관리' })
    ).toBeVisible();
    await openAccount(pageA, NEW_USERNAME);

    // B — 옛 세션은 다음 요청에서 401 → 로그인
    const stale = await pageB.request.get('/api/backend/v1/admin/members');
    expect(stale.status()).toBe(401);
    await pageB.goto('/members');
    await expect(pageB).toHaveURL(/\/login/);
    await contextB.close();

    // 새 자격으로만 로그인된다
    expect(await serverLogin(NEW_USERNAME, NEW_PASSWORD)).not.toBeNull();
    expect(await serverLogin(SESSION_USERNAME, PASSWORD)).toBeNull();

    // A 에서 원래 아이디·비밀번호로 되돌린다
    const restore = await pageA.request.patch('/api/auth/account', {
      data: {
        currentPassword: NEW_PASSWORD,
        newUsername: SESSION_USERNAME,
        newPassword: PASSWORD,
      },
    });
    expect(restore.status()).toBe(200);
    expect(await serverLogin(SESSION_USERNAME, PASSWORD)).not.toBeNull();
  });
});
