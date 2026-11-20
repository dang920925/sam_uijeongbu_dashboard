// ----------------------------------------------------------------------
// 관리자 세션 자동 연장(슬라이딩 세션 — 지휘자 T-PUSH 추가, 사용자 승인 2026-11-20).
// BFF 프록시가 관리자 요청 때 쿠키 토큰 남은 기간이 3일 미만이면 서버 refresh → 쿠키를 새 7일 토큰으로 바꾼다.
// 목 `__mock/session` 이 남은 기간을 정한 JWT 모양 세션을 만든다. 공용 storageState 를 쓰지 않는다(세션을 직접 넣음).
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
} from '@playwright/test';

import { FIXTURE_ADMIN, resetMock } from '@/e2e-pw/support/mock-api';

const COOKIE = '__Host-sam_admin';
const API = '/api/backend/v1';
const DAY_S = 24 * 60 * 60;

test.use({ storageState: { cookies: [], origins: [] } });

async function mockSession(
  request: APIRequestContext,
  ttlSeconds: number
): Promise<string> {
  const res = await request.post(`${API}/__mock/session`, {
    data: { ttlSeconds },
  });
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { accessToken: string }).accessToken;
}

async function useSession(
  context: BrowserContext,
  baseURL: string,
  token: string
): Promise<void> {
  await context.addCookies([
    {
      name: COOKIE,
      value: token,
      domain: new URL(baseURL).hostname,
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 7 * DAY_S,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
    },
  ]);
}

async function sessionCookie(context: BrowserContext) {
  return (await context.cookies()).find((cookie) => cookie.name === COOKIE);
}

test.describe('관리자 세션 자동 연장', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });
  test.afterEach(async ({ request }) => {
    await resetMock(request);
  });

  test('남은 기간이 3일 미만이면 관리자 요청 한 번에 쿠키가 새 7일 토큰으로 바뀐다', async ({
    context,
    request,
    baseURL,
  }) => {
    // Arrange
    const old = await mockSession(request, 2 * DAY_S);
    await useSession(context, baseURL!, old);
    // Act
    const res = await context.request.get(`${API}/auth/me`);
    // Assert
    expect(res.status()).toBe(200);
    const cookie = await sessionCookie(context);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.value).not.toBe(old);
    const daysLeft = ((cookie?.expires ?? 0) - Date.now() / 1000) / DAY_S;
    expect(daysLeft).toBeGreaterThan(6.9);
    // 새 토큰으로도 그대로 쓸 수 있다
    expect((await context.request.get(`${API}/auth/me`)).status()).toBe(200);
  });

  test('3일 이상 남았으면 쿠키를 바꾸지 않는다', async ({
    context,
    request,
    baseURL,
  }) => {
    const old = await mockSession(request, 4 * DAY_S);
    await useSession(context, baseURL!, old);

    const res = await context.request.get(`${API}/auth/me`);

    expect(res.status()).toBe(200);
    expect((await sessionCookie(context))?.value).toBe(old);
  });

  test('계정 변경으로 세션 버전이 바뀐 토큰은 연장되지 않고 401 이며 쿠키가 지워진다', async ({
    browser,
    context,
    request,
    baseURL,
  }) => {
    // Arrange — 이 기기는 남은 기간 2일 토큰, 다른 기기에서 비밀번호를 바꾼다(세션 버전 +1)
    const stale = await mockSession(request, 2 * DAY_S);
    await useSession(context, baseURL!, stale);
    const other = await browser.newContext({ baseURL });
    await useSession(other, baseURL!, await mockSession(request, 7 * DAY_S));
    const changed = await other.request.patch(`${API}/admin/account`, {
      data: {
        currentPassword: FIXTURE_ADMIN.password,
        newUsername: FIXTURE_ADMIN.username,
        newPassword: 'fixture-session-refresh-pw',
      },
    });
    expect(changed.status()).toBe(200);
    await other.close();
    // Act
    const refresh = await context.request.post(`${API}/auth/refresh`);
    const me = await context.request.get(`${API}/auth/me`);
    // Assert
    expect(refresh.status()).toBe(401);
    expect(me.status()).toBe(401);
    expect((await sessionCookie(context))?.value ?? '').toBe('');
  });
});
