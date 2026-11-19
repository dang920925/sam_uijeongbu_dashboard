// ----------------------------------------------------------------------
// SCR-D00 공용 틀 — 메뉴 8개, 활성 표시, 세션 없음 → 로그인, 로그아웃(FN-08), xs 드로어.
// ----------------------------------------------------------------------
import { expect, test } from '@playwright/test';

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

test.describe('SCR-D00 대시보드 공용', () => {
  test('메뉴 8개를 현행 순서로 보여 주고 이동하면 활성 메뉴가 바뀐다', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    if (isMobile) await page.getByRole('button', { name: '메뉴 열기' }).click();
    const nav = page.getByRole('navigation', { name: '관리자 메뉴' }).last();
    for (const label of MENU)
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    await nav.getByRole('link', { name: '갤러리' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
    if (isMobile) await page.getByRole('button', { name: '메뉴 열기' }).click();
    await expect(
      page
        .getByRole('navigation', { name: '관리자 메뉴' })
        .last()
        .getByRole('link', { name: '갤러리' })
    ).toHaveAttribute('aria-current', 'page');
  });

  test('세션 쿠키가 없으면 관리 화면 대신 로그인으로 보낸다', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto('/performances');
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });

  test('로그아웃하면 쿠키가 지워지고 로그인 화면으로 간다', async ({
    browser,
    baseURL,
  }) => {
    // 공유 storageState 를 망가뜨리지 않게 새 세션으로 로그인한다
    const context = await browser.newContext();
    const login = await context.request.post(`${baseURL}/api/auth/login`, {
      data: { username: 'fixture-admin', password: 'fixture-password' },
    });
    expect(login.status()).toBe(204);
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: '로그아웃' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });
});
