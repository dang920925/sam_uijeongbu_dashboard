// ----------------------------------------------------------------------
// (U40) 메뉴 배지 · 앱 아이콘 배지 — 요약(GET /admin/dashboard/summary)을 가로채 숫자를 정한다.
// - '예매 관리' = 입금 대기(pendingReservationCount) · '신청서 관리' = 연락 전(uncontactedPendingCount).
// - 0 이면 숨김, 99 초과 "99+", 이름 "입금 대기 n건"(role=img).
// - 앱 아이콘: navigator.setAppBadge / clearAppBadge 를 모의 객체로 바꿔 호출을 기록한다.
// desktop 은 사이드바, mobile 은 햄버거 드로어를 열어 같은 것을 본다.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { resetMock } from '@/e2e-pw/support/mock-api';

const SUMMARY_URL = '**/api/backend/v1/admin/dashboard/summary';

function summary(pendingReservationCount: number, uncontacted: number) {
  return {
    performances: { total: 0, ongoing: 0, upcoming: 0 },
    actorCount: 0,
    pendingApplicationCount: uncontacted,
    uncontactedPendingCount: uncontacted,
    pendingReservationCount,
    scheduleCount: 0,
    recentPerformances: [],
    pendingApplications: [],
  };
}

async function stubSummary(
  page: Page,
  reservations: number,
  uncontacted: number
) {
  await page.route(SUMMARY_URL, (route) =>
    route.fulfill({ json: summary(reservations, uncontacted) })
  );
}

/** navigator.setAppBadge·clearAppBadge 모의 — 호출을 window.__badgeCalls 에 남긴다 */
async function mockBadging(page: Page) {
  await page.addInitScript(() => {
    const calls: unknown[][] = [];
    Object.assign(window, { __badgeCalls: calls });
    Object.assign(navigator, {
      setAppBadge: (n?: number) => {
        calls.push(['set', n]);
        return Promise.resolve();
      },
      clearAppBadge: () => {
        calls.push(['clear']);
        return Promise.resolve();
      },
    });
  });
}

function badgeCalls(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __badgeCalls: unknown[][] }).__badgeCalls
  );
}

async function nav(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: '메뉴 열기' }).click();
  return page.getByRole('navigation', { name: '관리자 메뉴' }).filter({
    visible: true,
  });
}

test.describe('U40 메뉴·앱 아이콘 배지', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('입금 대기·연락 전 수를 메뉴 옆 빨간 배지로 보이고 앱 아이콘에 입금 대기 수를 단다', async ({
    page,
    isMobile,
  }) => {
    await mockBadging(page);
    await stubSummary(page, 3, 2);
    await page.goto('/');
    const menu = await nav(page, isMobile);

    const reservations = menu.getByRole('link', { name: /예매 관리/ });
    await expect(
      reservations.getByRole('img', { name: '입금 대기 3건' })
    ).toHaveText('3');
    await expect(
      menu
        .getByRole('link', { name: /신청서 관리/ })
        .getByRole('img', { name: '연락 전 2건' })
    ).toHaveText('2');
    await expect.poll(() => badgeCalls(page)).toContainEqual(['set', 3]);
  });

  test('0 이면 배지를 숨기고 앱 아이콘 배지를 지운다', async ({
    page,
    isMobile,
  }) => {
    await mockBadging(page);
    await stubSummary(page, 0, 0);
    await page.goto('/');
    const menu = await nav(page, isMobile);

    await expect(menu.getByRole('link', { name: /예매 관리/ })).toBeVisible();
    await expect(menu.getByTestId('nav-badge')).toHaveCount(0);
    await expect.poll(() => badgeCalls(page)).toContainEqual(['clear']);
  });

  test('99 를 넘으면 "99+" 로 보이고 이름에는 실제 숫자를 쓴다', async ({
    page,
    isMobile,
  }) => {
    await stubSummary(page, 120, 100);
    await page.goto('/');
    const menu = await nav(page, isMobile);

    await expect(menu.getByRole('img', { name: '입금 대기 120건' })).toHaveText(
      '99+'
    );
    await expect(menu.getByRole('img', { name: '연락 전 100건' })).toHaveText(
      '99+'
    );
  });

  test('Badging API 가 없는 브라우저에서도 화면은 그대로 뜬다', async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(() => {
      Object.assign(navigator, {
        setAppBadge: undefined,
        clearAppBadge: undefined,
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await stubSummary(page, 5, 0);
    await page.goto('/');
    const menu = await nav(page, isMobile);

    await expect(
      menu.getByRole('img', { name: '입금 대기 5건' })
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
});
